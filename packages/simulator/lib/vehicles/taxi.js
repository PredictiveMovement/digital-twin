const Vehicle = require('../vehicles/vehicle')
class Taxi extends Vehicle {
  id
  position
  heading

  constructor({ id, position }) {
    super()
    this.id = id
    this.position = position
    this.heading = null
    this.currentPassengerCount = 0
    this.queue = []
  }
  canPickupBooking() {}
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
    console.log('hej')
  }
}

module.exports = Taxi
