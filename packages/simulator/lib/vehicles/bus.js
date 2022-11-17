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
    this.passengers = []
    this.startPosition = startPosition
    this.passengerCapacity = 50 // TODO: fill this from the workshop poll
    this.co2PerKmKg = 1.3 // NOTE: From a quick google. Needs to be verified.
  }

  async handleBooking(booking) {
    if (!this.busy) {
      this.busy = true
      this.booking = booking
      booking.assign(this)
      this.status = 'pickup'
      await this.navigateTo(booking.destination.position)
      this.movedEvents.next(this)
    } else {
      this.queue.push(booking)
      booking.queued(this)
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

    await this.waitAtPickup()

    this.lineNumber = this.booking.lineNumber
      ? this.booking.lineNumber
      : this.lineNumber

    this.booking.pickedUp(this.position)
    if (this.booking.type !== 'busstop') {
      this.cargo.push(this.booking)
    }

    if (!this.booking) {
      this.simulate(false)
      return
    }
    this.status = 'delivery'
    return this.navigateTo(this.booking.destination.position) // resume simulation
  }
}

module.exports = Bus
