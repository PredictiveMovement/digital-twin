const Booking = require('../models/booking')
const Vehicle = require('./vehicle')
const { pairwise, map } = require('rxjs/operators')
const moment = require('moment')
const { virtualTime } = require('../virtualTime')

// TODO: create this somewhere else as real fleet
const lanstrafiken = {
  name: 'Länstrafiken i Norrbotten',
}

class Bus extends Vehicle {
  constructor({
    startPosition,
    position,
    heading,
    lineNumber,
    id,
    stops,
    finalStop,
    kommun,
    ...vehicle
  }) {
    super({
      position,
      id,
      stops,
      fleet: lanstrafiken,
      ...vehicle,
    })
    this.lineNumber = lineNumber
    this.finalStop = finalStop
    this.vehicleType = 'bus'
    this.heading = heading
    this.kommun = kommun
    this.startPosition = startPosition
    this.co2PerKmKg = 1.3 // NOTE: From a quick google. Needs to be verified.
    stops
      .pipe(
        pairwise(),
        map(([pickup, destination]) => {
          this.handleBooking(
            new Booking({
              // pickup and destination contains both position and arrival and departure time
              pickup,
              destination,
            })
          )
        })
      )
      .subscribe(() => {})
  }

  async handleBooking(booking) {
    if (!this.busy) {
      this.busy = true
      this.booking = booking
      booking.assign(this)
      this.status = 'Pickup'
      await this.navigateTo(booking.destination.position)
      this.movedEvents.next(this)
    } else {
      this.queue.push(booking)
      booking.queue(this)
    }
    return booking
  }

  reset() {
    this.queue = []
    this.busy = false
    this.position = this.startPosition
  }

  // This is called when the bus arrives at each stop. Let's check if the departure time
  // is in the future. If it is, we wait until the departure time.
  async pickup() {
    this.booking = this.queue.shift()
    if (!this.booking) {
      this.simulate(false)
      return
    }

    this.lineNumber = this.booking.lineNumber
      ? this.booking.lineNumber
      : this.lineNumber

    this.booking.pickedUp(this.position)
    this.cargo.push(this.booking)

    const departure = moment(
      this.booking.pickup.departureTime,
      'hh:mm:ss'
    ).valueOf()
    this.simulate(false) // pause interpolation while we wait
    const waitingtime = moment(departure).diff(moment(virtualTime.time()))

    if (waitingtime > 0) await virtualTime.waitUntil(departure)
    if (!this.booking) {
      this.simulate(false)
      return
    }
    return this.navigateTo(this.booking.destination.position) // resume simulation
  }
}

module.exports = Bus
