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
    this.cargo = []
    this.instructions = []
    this.queue = []
    this.capacity = 4
    this.booking = true
    this.vehicleType = 'taxi'
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
      this.instructions.push(instruction)
    }
  }
  pickup() {
    if (this.instruction.passenger && this.instruction.type === 'pickup') {
      this.instruction.passenger.pickedUp()
      console.log('picked up passenger', this.instruction.passenger)
      this.cargo.push(this.instruction.passenger)
    }
    if (this.instruction.passenger && this.instruction.type === 'delivery') {
      this.instruction.passenger.delivered()
      this.cargo = this.cargo.filter(
        (passenger) => passenger !== this.instruction.passenger
      )
    }
    this.instruction = this.instructions.shift()
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
