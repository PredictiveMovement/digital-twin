const Vehicle = require('../vehicles/vehicle')
class Taxi extends Vehicle {
  id
  position
  heading

  constructor({ id, position, ...vehicle }) {
    super({ position, id, fleet: 'taxi', ...vehicle })
    this.id = id
    this.position = position
    this.heading = null
    this.currentPassengerCount = 0
    this.queue = []
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
    console.log('pickup')
    console.log(this.queue)
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
