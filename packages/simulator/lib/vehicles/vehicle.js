const osrm = require('../osrm')
const { haversine, bearing } = require('../distance')
const interpolate = require('../interpolate')
const Booking = require('../models/booking')
const { safeId } = require('../id')
const { assert } = require('console')
const { error, info } = require('../log')
const { virtualTime } = require('../virtualTime')
const { throws } = require('assert')
const Position = require('../models/position')

const { ReplaySubject } = require('rxjs')
const { tap, pairwise } = require('rxjs/operators')
class Vehicle {
  constructor({
    id = 'v-' + safeId(),
    position,
    status = 'Ready',
    capacity = 250,
    weight = 10000,
    fleet,

    /*
     * CO2
     *
     * https://www.naturvardsverket.se/data-och-statistik/klimat/vaxthusgaser-utslapp-fran-inrikes-transporter/
     * https://www.trafa.se/globalassets/rapporter/2010-2015/2015/rapport-2015_12-lastbilars-klimateffektivitet-och-utslapp.pdf
     *
     * TODO: Move the co2 things to its own file.
     */
    co2PerKmKg = 0.013 / 1000,
  } = {}) {
    this.id = id
    this.position = position
    this.origin = position
    this.queue = []
    this.cargo = []
    this.delivered = []
    this.capacity = capacity // bookings
    this.weight = weight // http://www.lastbilsteori.se/lastvikt.html
    this.costPerHour = 3000 / 12 // ?
    this.co2 = 0
    this.distance = 0
    this.status = status
    this.fleet = fleet
    this.created = this.time()
    this.co2PerKmKg = co2PerKmKg
    this.vehicleType = 'default'
    this.movedEvents = new ReplaySubject()
    this.cargoEvents = new ReplaySubject()
    this.statusEvents = new ReplaySubject()
  }

  dispose() {
    this.simulate(false)
    this._disposed = true
  }

  time() {
    return virtualTime.getTimeInMillisecondsAsPromise()
  }

  simulate(route) {
    if (this.movementSubscription) {
      this.movementSubscription.unsubscribe()
    }
    // clearInterval(this._interval)
    if (!route) return
    if (virtualTime.timeMultiplier === Infinity)
      return this.updatePosition(route) // teleport mode
    this.movementSubscription = virtualTime
      .getTimeInMilliseconds()
      .pipe(pairwise())
      .subscribe(([previousTimeInMs, currentTimeInMs]) => {
        const diffFromLastTime = previousTimeInMs
          ? currentTimeInMs - previousTimeInMs
          : 0
        if (virtualTime.timeMultiplier === 0) return // don't update position when time is stopped
        const { next, pointsDiffFromPrevious, ...position } =
          interpolate.route(route, currentTimeInMs, diffFromLastTime) ??
          this.heading
        const newPosition = new Position(position)
        if (route.started > currentTimeInMs) {
          this.movementSubscription.unsubscribe()
          return
        }
        this.updatePosition(
          newPosition,
          pointsDiffFromPrevious,
          currentTimeInMs
        )
        if (!next) this.stopped()
      })
  }

  navigateTo(position) {
    this.heading = position
    return osrm
      .route(this.position, this.heading)
      .then(async (route) => {
        route.started = await this.time()
        this.route = route
        if (!route.legs)
          throw new Error(
            `Route not found from: ${JSON.stringify(
              this.position
            )} to: ${JSON.stringify(this.heading)} from: ${JSON.stringify(
              this.position
            )}`
          )
        this.simulate(this.route)
        return this.heading
      })
      .catch((err) => error('Route error', err))
  }

  handleBooking(booking) {
    assert(booking instanceof Booking, 'Booking needs to be of type Booking')

    if (!this.busy) {
      this.busy = true
      this.booking = booking
      booking.assign(this)
      this.status = 'Pickup'
      this.statusEvents.next(this)

      this.navigateTo(booking.pickup.position)
    } else {
      // TODO: switch places with current booking if it makes more sense to pick this package up before picking up current
      this.queue.push(booking)
      booking.queued(this)
    }
    return booking
  }

  pickup() {
    if (this._disposed) return

    // this.queue.sort(
    //   (a, b) =>
    //     haversine(this.position, a.pickup.position) -
    //     haversine(this.position, b.pickup.position)
    // )

    // wait one tick so the pickup event can be parsed before changing status
    setImmediate(() => {
      if (this.booking) this.booking.pickedUp(this.position)
      this.cargo.push(this.booking)
      // see if we have more packages to pickup from this position
      while (
        this.queue.length < this.capacity &&
        this.queue.length &&
        haversine(this.position, this.queue[0].pickup.position) < 200
      ) {
        const booking = this.queue.shift()
        booking.pickedUp(this.position)
        this.cargo.push(booking)
        this.cargoEvents.next(this)
      }
      if (this.booking && this.booking.destination) {
        this.booking.pickedUp(this.position)
        this.status = 'Delivery'
        this.statusEvents.next(this)

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
    if (this.booking) {
      this.busy = false
      this.booking.delivered(this.position)
      this.delivered.push(this.booking)
    }

    this.pickNextFromCargo()
  }

  pickNextFromCargo() {
    // pick next from cargo
    this.cargo.sort(
      (a, b) =>
        haversine(this.position, a.destination.position) -
        haversine(this.position, b.destination.position)
    )
    const booking = this.cargo.shift()
    this.cargoEvents.next(this)

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

  async updatePosition(position, pointsPassedSinceLastUpdate, time) {
    const lastPosition = this.position || position
    const timeDiff = time - this.lastPositionUpdate

    const metersMoved =
      (this.route &&
        this.lastPositionUpdate &&
        interpolate.getDiff(this.route, this.lastPositionUpdate, time)
          .distance) ||
      haversine(lastPosition, position)
    const [km, h] = [
      metersMoved / 1000,
      (time - this.lastPositionUpdate) / 1000 / 60 / 60,
    ]

    const co2 = this.updateCarbonDioxide(km)

    // TODO: Find which kommun the vehicle is moving in now and add the co2 for this position change to that kommun

    /*
     * Distance traveled.
     */
    this.distance += km
    this.pointsPassedSinceLastUpdate = pointsPassedSinceLastUpdate
    this.speed = Math.round(km / h || 0)
    this.position = position
    this.lastPositionUpdate = time
    this.ema = haversine(this.heading, this.position)
    if (metersMoved > 0) {
      this.bearing = bearing(lastPosition, position) || 0
      this.movedEvents.next(this)

      // NOTE: cargo is passengers or packages.
      this.cargo.map((booking) => {
        booking.moved(
          this.position,
          metersMoved,
          co2 / (this.cargo.length + 1), // TODO: Why do we do +1 here? Because we have one active booking + cargo
          (h * this.costPerHour) / (this.cargo.length + 1),
          timeDiff
        )
      })
    }
  }

  stopped() {
    this.statusEvents.next(this)
    if (this.booking) {
      this.simulate(false)
      if (this.status === 'Pickup') this.pickup()
      if (this.status === 'Delivery') this.dropOff()
    }
  }

  /**
   * Add carbon dioxide emissions to this vehicle according to the distance traveled.
   * @param {number} Distance The distance traveled in km
   * @returns {number} The amount of carbon dioxide emitted
   */
  updateCarbonDioxide(distance) {
    let co2

    switch (this.vehicleType) {
      case 'bus':
      case 'car':
      case 'taxi':
        co2 = distance * this.co2PerKmKg
        break
      default:
        co2 = (this.weight + this.cargoWeight()) * distance * this.co2PerKmKg
    }

    this.co2 += co2
    return co2
  }
}

module.exports = Vehicle
