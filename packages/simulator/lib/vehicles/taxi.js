const moment = require('moment')
const { safeId } = require('../id')
const { info } = require('../log')
const Vehicle = require('../vehicles/vehicle')
const { virtualTime } = require('../virtualTime')
const fleet = {
  name: 'taxi',
}

class Taxi extends Vehicle {
  id
  position
  heading
  constructor({ id = 't-' + safeId(), position, startPosition, ...vehicle }) {
    super({ position, id, fleet, ...vehicle })
    this.id = id
    this.position = position
    this.heading = null
    this.currentPassengerCount = 0
    this.cargo = []
    this.queue = []
    this.capacity = 4
    this.booking = true
    this.vehicleType = 'taxi'
    this.startPosition = startPosition
    this.co2PerKmKg = 0.1201 // NOTE: From a quick google. Needs to be verified.
  }
  pickup() {
    super.pickup()
    info('Pickup passenger', this.booking?.passenger?.name)
    this.currentPassengerCount++
  }
  dropoff() {
    super.dropoff()
    info('dropoff passenger') //TODO: NEVER GETS CALLED
    this.currentPassengerCount--
  }
}

module.exports = Taxi
