const Vehicle = require('../vehicles/vehicle')

const fleet = {
  name: 'taxi',
}

class Taxi extends Vehicle {
  id
  position
  heading
  constructor({ id, position, ...vehicle }) {
    super({ position, id, fleet, ...vehicle })
    this.id = id
    this.position = position
    this.heading = null
    this.currentPassengerCount = 0
    this.queue = []
    this.capacity = 4
    this.booking = true
  }
  canPickupBooking() {
    true
  }
  hej() {
    console.log('hej')
  }
  addInstruction(instruction) {
    const location = instruction.location
    if (!this.busy) {
      this.busy = true
      this.status = 'Pickup'
      this.navigateTo({
        lat: location[0],
        lon: location[1],
      })
    } else {
      this.queue.push(instruction)
    }
  }
  pickup() {
    console.log(`pickup in taxi ${this.id}, ${this.queue.length}`)
    const next = this.queue.shift()

    if (next) {
      const location = next.location
      this.navigateTo({
        lat: location[0],
        lon: location[1],
      })
    }
  }
}

module.exports = Taxi
