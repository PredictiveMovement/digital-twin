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
  addInstruction(instruction) {
    if (instruction.type === 'start') {
      return
    }
    // console.log(instruction)
    const location = instruction.location
    if (!this.busy) {
      this.busy = true
      this.status = 'Pickup'
      this.instruction = instruction
      this.navigateTo({
        lat: location[0],
        lon: location[1],
      })
    } else {
      this.queue.push(instruction)
    }
  }
  pickup() {
    if (this.instruction.passenger && this.instruction.type === 'pickup') {
      this.instruction.passenger.pickedUp()
    }
    this.instruction = this.queue.shift()
    if (this.instruction) {
      const location = this.instruction.location
      this.navigateTo({
        lat: location[0],
        lon: location[1],
      })
    }
  }
}

module.exports = Taxi
