const osrm = require('../lib/osrm')
const { haversine, bearing } = require('./distance')
const interpolate = require('./interpolate')
const EventEmitter = require('events')
const Booking = require('./booking')
const { safeId } = require('./id')
const { assert } = require('console')
const { error, info } = require('../lib/log')

class Car extends EventEmitter {
  constructor({ id = safeId(), position, status = 'Ready', capacity = 250, timeMultiplier = 60, fleet } = {}) {
    super()
    this.id = id
    this.position = position
    this.origin = position
    this.history = []
    this.queue = []
    this.cargo = []
    this.delivered = []
    this.capacity = capacity // bookings
    this.status = status
    this.lastPositions = []
    this.timeMultiplier = timeMultiplier
    this.fleet = fleet
    this.created = Date.now()
    this.on('error', (err) => error('Car error', err))
    this.emit('moved', this)
  }

  time() {
    const diff = Date.now() - this.created
    return Date.now() + diff * this.timeMultiplier
  }

  simulate(heading) {
    clearInterval(this._interval)
    if (!heading) return
    if (this.timeMultiplier === Infinity) return this.updatePosition(heading) // teleport mode
    this._interval = setInterval(() => {
      const newPosition = interpolate.route(heading.route, this.time()) ?? heading
      this.updatePosition(newPosition)
    }, 200)
  }

  navigateTo(position) {
    this.heading = position
    return osrm
      .route(this.position, this.heading)
      .then((route) => {
        route.started = this.time()
        this.heading.route = route
        //info(`Car ${this.id} navigates to`, position)

        if (!route.legs) throw new Error(`Route not found from: ${JSON.stringify(this.position)} to: ${JSON.stringify(this.heading)}`)
        this.simulate(this.heading)
        return this.heading
      })
      .catch(error)
  }

  handleBooking(booking) {
    assert(booking instanceof Booking, 'Booking needs to be of type Booking')
    this.history.push({ status: 'received_booking', date: new Date(), booking })
    if (!this.busy) {
      this.busy = true
      this.emit('busy', this)
      this.booking = booking
      booking.assigned(this)
      this.status = 'Pickup'
      this.navigateTo(booking.pickup.position)
    } else {
      this.queue.push(booking)
      booking.queued(this)
    }
    return booking
  }

  pickup() {
    this.emit('pickup', this.id)
    this.queue.sort((a, b) => haversine(this.position, a.pickup.position) - haversine(this.position, b.pickup.position))

    // wait one tick so the pickup event can be parsed before changing status
    setImmediate(() => {
      this.queue
        // see if we have more packages to deliver from this position
        .filter(booking => haversine(this.position, booking.pickup.position) < 400)
        .map(booking => {
          booking.pickedUp(this.position, this.time())
          this.cargo.push(booking)
          //delete this.queue[this.queue.findIndex(b => b.id === booking.id)] // todo: is this safe way to remove them from the queue?
          this.emit('cargo', this)
        })
      if (this.booking && this.booking.destination) {
        this.booking.pickedUp(this.position, this.time())
        this.status = 'Delivery'
        this.navigateTo(this.booking.destination.position)
      }
    })
  }

  dropOff() {
    info(`Dropoff ${this.booking.id}`)
    if (this.booking) {
      this.busy = false
      this.booking.delivered(this.position, this.time())
      this.delivered.push(this.booking)
      this.emit('busy', this)
      this.emit('dropoff', this)
    }

    this.booking = this.pickNextFromCargo()
    if (this.booking) {
      this.navigateTo(this.booking.destination.position)
    } else {
      // If we have no more packages to deliver in cargo, go to the nearest booking in the queue or back to origin
      this.queue.sort((a, b) => haversine(this.position, a.pickup.position) - haversine(this.position, b.pickup.position))

      const nextBooking = this.queue.shift()
      if (nextBooking) {
        this.handleBooking(nextBooking)
      } else {
        this.status = 'Ready'
        this.navigateTo(this.origin)
      }
    }
  }

  pickNextFromCargo() {
    // pick next from cargo
    this.cargo.sort((a, b) => haversine(this.position, a.destination.position) - haversine(this.position, b.destination.position))
    const booking = this.cargo.shift()
    this.emit('cargo', this)
    return booking
  }


  async updatePosition(position, date = Date.now()) {
    const lastPosition = this.position || position
    const metersMoved = haversine(lastPosition, position)
    const [km, h] = [(metersMoved / 1000), (date - lastPosition.date) / 1000 / 60 / 60]
    this.speed = Math.round((km / h / (this._timeMultiplier || 1)) || 0)
    this.position = position
    this.ema = haversine(this.heading, this.position)
    if (metersMoved > 0) {
      this.bearing = bearing(lastPosition, position) || 0
      this.lastPositions.push({ ...position, date })
      this.emit('moved', this)
    }

    if (this.booking) {
      this.booking.moved(this.position)
    }

    if (this.ema < 400 && this.speed < 40) {
      this.emit('stopped', this)
      this.simulate(false)
      if (this.booking) {
        if (this.status === 'Pickup') this.pickup()
        if (this.status === 'Delivery') this.dropOff()
      }
    }
  }
}

module.exports = Car
