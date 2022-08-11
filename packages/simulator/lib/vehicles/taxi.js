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
    this.co2PerKmKg = 0.1201 // NOTE: From a quick google. Needs to be verified.
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
        lat: location[1],
        lon: location[0],
      })
    } else {
      this.instructions.push(instruction)
    }
  }
  pickup() {
    if (this.instruction.passenger && this.instruction.type === 'pickup') {
      const passenger = this.instruction.passenger
      passenger.pickedUp()
      console.log(`Picked up passenger - ${passenger.id} ${passenger.name}`)
      this.cargo.push(passenger)
    }
    if (this.instruction.passenger && this.instruction.type === 'delivery') {
      const passenger = this.instruction.passenger
      passenger.delivered()
      console.log(`Delivered passenger - ${passenger.id} ${passenger.name}`)
      this.cargo = this.cargo.filter((passenger) => passenger !== passenger)
    }
    this.instruction = this.instructions.shift()
    if (this.instruction) {
      const location = this.instruction.location
      this.navigateTo({
        lat: location[1],
        lon: location[0],
      })
    }
  }
}

module.exports = Taxi
