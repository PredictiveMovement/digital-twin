const { ReplaySubject } = require('rxjs')
const { scan } = require('rxjs/operators')
const moment = require('moment')
const { assert } = require('console')

const osrm = require('../osrm')
const { haversine, bearing } = require('../distance')
const interpolate = require('../interpolate')
const Booking = require('../models/booking')
const { safeId } = require('../id')
const { error } = require('../log')
const { virtualTime } = require('../virtualTime')
const Position = require('../models/position')

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class Vehicle {
  constructor({
    id = 'v-' + safeId(),
    position,
    status = 'ready',
    parcelCapacity,
    passengerCapacity,
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
    this.parcelCapacity = parcelCapacity
    this.passengerCapacity = passengerCapacity
    this.weight = weight // http://www.lastbilsteori.se/lastvikt.html
    this.costPerHour = 3000 / 12 // ?
    this.co2 = 0
    this.distance = 0
    this.status = status
    this.fleet = fleet
    this.created = this.time()
    this.co2PerKmKg = co2PerKmKg
    this.vehicleType = 'default'

    // TODO: rename these to events.moved, events.cargo, events.status
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
    if (!route) return

    if (virtualTime.timeMultiplier === Infinity) {
      return this.updatePosition(route) // teleport mode
    }

    this.movementSubscription = virtualTime
      .getTimeInMilliseconds()
      .pipe(
        scan((prevRemainingPointsInRoute, currentTimeInMs) => {
          if (!prevRemainingPointsInRoute.length) {
            this.stopped()
            return []
          }

          const { skippedPoints, remainingPoints, ...position } =
            interpolate.route(
              route.started,
              currentTimeInMs,
              prevRemainingPointsInRoute
            ) ?? this.heading
          const newPosition = new Position(position)
          if (route.started > currentTimeInMs) {
            return []
          }
          this.updatePosition(newPosition, skippedPoints, currentTimeInMs)
          return remainingPoints
        }, interpolate.points(route))
      )
      .subscribe(() => null)
  }

  navigateTo(position) {
    this.heading = position

    if (this.position.distanceTo(position) < 5) {
      // Do not route if we are close enough.

      this.stopped()
      return position
    }

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
      .catch(
        (err) =>
          error('Route error, retrying in 1s...', err) ||
          wait(1000).then(() => this.navigateTo(position))
      )
  }

  async handleBooking(booking) {
    assert(booking instanceof Booking, 'Booking needs to be of type Booking')

    if (!this.booking) {
      this.booking = booking
      booking.assign(this)
      this.status = 'toPickup'
      this.statusEvents.next(this)

      this.navigateTo(booking.pickup.position)
    } else {
      // TODO: switch places with current booking if it makes more sense to pick this package up before picking up current
      this.queue.push(booking)
      // TODO: use vroom to optimize the queue
      booking.assign(this)

      booking.queued(this)
    }
    return booking
  }

  async waitAtPickup() {
    const departure = moment(
      this.booking.pickup.departureTime,
      'hh:mm:ss'
    ).valueOf()
    const waitingtime = moment(departure).diff(
      moment(await virtualTime.getTimeInMillisecondsAsPromise())
    )

    if (waitingtime > 0) {
      this.simulate(false) // pause interpolation while we wait
      await virtualTime.waitUntil(departure)
    }
  }
  async pickup() {
    if (this._disposed) return

    await this.waitAtPickup()

    // wait one tick so the pickup event can be parsed before changing status
    // eslint-disable-next-line no-undef
    setImmediate(() => {
      if (this.booking) this.booking.pickedUp(this.position)
      this.cargo.push(this.booking)
      // see if we have more packages to pickup from this position
      this.queue
        .filter((b) => this.position.distanceTo(b.pickup.position) < 200)
        .forEach((booking) => {
          this.cargo.push(booking)
          booking.pickedUp(this.position)
          this.cargoEvents.next(this)
        })
      if (this.booking && this.booking.destination) {
        this.booking.pickedUp(this.position)
        this.status = 'toDelivery'
        this.statusEvents.next(this)

        // should we first pickup more bookings before going to the destination?
        // TODO: call Vroom here instead of trying to do this manually..
        if (
          this.queue.length > 0 &&
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
      this.booking.delivered(this.position)
      this.delivered.push(this.booking)
      this.booking = null
    }
    this.statusEvents.next(this)

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
        this.status = 'ready'
        this.navigateTo(this.origin)
      }
    }
    return booking
  }

  cargoWeight() {
    return this.cargo.reduce((total, booking) => total + booking.weight, 0)
  }

  async updatePosition(position, pointsPassedSinceLastUpdate, time) {
    //console.count(`updatePosition${this.id}`)
    const lastPosition = this.position || position
    const timeDiff = time - this.lastPositionUpdate

    const metersMoved =
      pointsPassedSinceLastUpdate.reduce(
        (acc, { meters }) => acc + meters,
        0
      ) || haversine(lastPosition, position)

    const seconds = pointsPassedSinceLastUpdate.reduce(
      (acc, { duration }) => acc + duration,
      0
    )

    const [km, h] = [metersMoved / 1000, seconds / 60 / 60]

    const co2 = this.updateCarbonDioxide(km)

    // TODO: Find which municipality the vehicle is moving in now and add the co2 for this position change to that municipality

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
      // eslint-disable-next-line no-unexpected-multiline
      const cargoAndPassengers = [...this.cargo, ...(this.passengers || [])]
      cargoAndPassengers.map((booking) => {
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

  // start -> toPickup -> pickup -> toDelivery -> delivery -> start

  stopped() {
    this.speed = 0
    this.statusEvents.next(this)
    if (this.booking) {
      this.simulate(false)
      if (this.status === 'toPickup') return this.pickup()
      if (this.status === 'toDelivery') return this.dropOff()
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
