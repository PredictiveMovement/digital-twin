const osrm = require('../osrm')
const { haversine, bearing } = require('../distance')
const interpolate = require('../interpolate')
const EventEmitter = require('events')
const Booking = require('../booking')
const { safeId } = require('../id')
const { assert } = require('console')
const { error, info } = require('../log')
const { virtualTime } = require('../virtualTime')
const { throws } = require('assert')

class Vehicle extends EventEmitter {
  constructor({
    id = safeId(),
    position,
    status = 'Ready',
    capacity = 250,
    weight = 10000,
    fleet,
    co2PerKmKg = 0.013 / 1000,
  } = {}) {
    super()
    this.id = id
    this.position = position
    this.origin = position
    this.history = []
    this.queue = []
    this.cargo = []
    this.delivered = []
    this.capacity = capacity // bookings
    this.weight = weight // http://www.lastbilsteori.se/lastvikt.html
    this.costPerHour = 3000 / 12 // ?
    this.co2 = 0
    this.status = status
    this.lastPositions = []
    this.fleet = fleet
    this.created = this.time()
    this.co2PerKmKg = co2PerKmKg
    this.on('error', (err) => error('Car error', err))
    this.emit('moved', this)
  }

  dispose() {
    this.simulate(false)
    this._disposed = true
  }

  time() {
    const time = virtualTime.time()
    return time
  }

  simulate(route) {
    clearInterval(this._interval)
    if (!route) return
    if (virtualTime.timeMultiplier === Infinity)
      return this.updatePosition(route) // teleport mode
    this._interval = setInterval(() => {
      if (virtualTime.timeMultiplier === 0) return // don't update position when time is stopped
      const newPosition = interpolate.route(route, this.time()) ?? this.heading
      this.updatePosition(newPosition)
    }, Math.random() * 200)
  }

  navigateTo(position) {
    this.heading = position
    return osrm
      .route(this.position, this.heading)
      .then((route) => {
        route.started = this.time()
        this.route = route
        //info(`Car ${this.id} navigates to`, position)
        if (!route.legs)
          throw new Error(
            `Route not found from: ${JSON.stringify(
              this.position
            )} to: ${JSON.stringify(this.heading)}`
          )
        this.simulate(this.route)
        return this.heading
      })
      .catch((err) => error('Route error', err))
  }

  handleBooking(booking) {
    // console.log('** handle booking', booking.id)
    assert(booking instanceof Booking, 'Booking needs to be of type Booking')
    this.history.push({
      status: 'received_booking',
      date: this.time(),
      booking,
    })
    if (!this.busy) {
      this.busy = true
      this.emit('busy', this)
      this.booking = booking
      booking.assigned(this)
      this.status = 'Pickup'
      this.navigateTo(booking.pickup.position)
    } else {
      // TODO: swith places with current booking if it makes more sense to pick this package up before picking up current
      this.queue.push(booking)
      booking.queued(this)
    }
    return booking
  }

  pickup() {
    if (this._disposed) return

    this.emit('pickup', this.id)
    this.queue.sort(
      (a, b) =>
        haversine(this.position, a.pickup.position) -
        haversine(this.position, b.pickup.position)
    )

    // wait one tick so the pickup event can be parsed before changing status
    setImmediate(() => {
      // see if we have more packages to pickup from this position
      while (
        this.queue.length < this.capacity &&
        this.queue.length &&
        haversine(this.position, this.queue[0].pickup.position) < 100
      ) {
        const booking = this.queue.shift()
        booking.pickedUp(this.position)
        this.cargo.push(booking)
        this.emit('cargo', this)
      }
      if (this.booking && this.booking.destination) {
        this.booking.pickedUp(this.position)
        this.status = 'Delivery'

        // should we first pickup more bookings before going to the destination?
        if (
          this.queue.length < this.capacity &&
          this.queue.length &&
          haversine(this.queue[0].pickup.position, this.position) <
            haversine(this.booking.destination.position, this.position)
        ) {
          this.navigateTo(this.queue[0].pickup.position)
        } else {
          this.navigateTo(this.booking.destination.position)
        }
      }
    })
  }

  dropOff() {
    //finfo(`Dropoff ${this.booking.id}`)
    if (this.booking) {
      this.busy = false
      // delete this.cargo[this.cargo.findIndex(b => b.id === this.booking.id)]
      this.booking.delivered(this.position)
      this.delivered.push(this.booking)
      this.emit('busy', this)
      this.emit('dropoff', this)
    }

    this.booking = this.pickNextFromCargo()
  }

  pickNextFromCargo() {
    // pick next from cargo
    this.cargo.sort(
      (a, b) =>
        haversine(this.position, a.destination.position) -
        haversine(this.position, b.destination.position)
    )
    const booking = this.cargo.shift()
    this.emit('cargo', this)

    if (booking) {
      this.navigateTo(this.booking.destination.position)
    } else {
      // If we have no more packages to deliver in cargo, go to the nearest booking in the queue or back to origin
      this.queue.sort(
        (a, b) =>
          haversine(this.position, a.destination.position) -
          haversine(this.position, b.destination.position)
      )

      const nextBooking = this.queue.shift()
      if (nextBooking) {
        this.handleBooking(nextBooking)
      } else {
        this.status = 'Ready'
        this.navigateTo(this.origin)
      }
    }
    return booking
  }

  cargoWeight() {
    return this.cargo.reduce((total, booking) => total + booking.weight, 0)
  }

  canPickupBooking(booking) {
    return this.capacity > this.queue.length + this.cargo.length
  }

  async updatePosition(position, date = this.time()) {
    const lastPosition = this.position || position
    const metersMoved =
      (this.route &&
        this.lastPositionUpdate &&
        interpolate.getDiff(this.route, this.lastPositionUpdate, date)
          .distance) ||
      haversine(lastPosition, position)
    const [km, h] = [
      metersMoved / 1000,
      (date - this.lastPositionUpdate) / 1000 / 60 / 60,
    ]
    // https://www.naturvardsverket.se/data-och-statistik/klimat/vaxthusgaser-utslapp-fran-inrikes-transporter/
    // https://www.trafa.se/globalassets/rapporter/2010-2015/2015/rapport-2015_12-lastbilars-klimateffektivitet-och-utslapp.pdf
    const co2 = (this.weight + this.cargoWeight()) * km * this.co2PerKmKg
    this.co2 += co2
    this.speed = Math.round(km / h || 0)
    this.position = position
    this.lastPositionUpdate = date
    this.ema = haversine(this.heading, this.position)
    if (metersMoved > 0) {
      this.bearing = bearing(lastPosition, position) || 0
      this.lastPositions.push({ ...position, date })
      this.emit('moved', this)

      this.cargo.map((booking) => {
        booking.moved(
          this.position,
          metersMoved,
          co2 / (this.cargo.length + 1),
          (h * this.costPerHour) / (this.cargo.length + 1)
        )
      })
    }

    if (!position.next) {
      this.emit('stopped', this)
      this.simulate(false)
      if (this.booking) {
        if (this.status === 'Pickup') this.pickup()
        if (this.status === 'Delivery') this.dropOff()
      }
    }
  }
}

module.exports = Vehicle
