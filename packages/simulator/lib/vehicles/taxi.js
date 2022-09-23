const Vehicle = require('../vehicles/vehicle')
const { virtualTime } = require('../virtualTime')
const fleet = {
  name: 'taxi',
}

class Taxi extends Vehicle {
  id
  position
  heading
  constructor({ id, position, startPosition, ...vehicle }) {
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
    this.startPosition = startPosition
    this.co2PerKmKg = 0.1201 // NOTE: From a quick google. Needs to be verified.
  }
  canPickupBooking() {
    true
  }

  navigateNextJob() {
    if (!this.instruction) return
    const location = this.instruction.location
    return this.navigateTo({
      lat: location[1],
      lon: location[0],
    })
  }
  reset() {
    this.instructions = []
    this.busy = false
    this.position = this.startPosition
    this.cargo = []
  }

  addInstruction(instruction) {
    if (instruction.type === 'start') {
      return
    }
    const location = instruction.location
    if (!this.busy) {
      this.busy = true
      this.status = 'Pickup'
      this.instruction = instruction
      this.navigateNextJob()
    } else {
      this.instructions.push(instruction)
    }
  }
  async pickup() {
    if (this.instruction.passenger && this.instruction.type === 'pickup') {
      const passenger = this.instruction.passenger
      passenger.pickedUp(this.instruction.journeyId)
      this.cargo.push(passenger)
    }
    if (this.instruction.passenger && this.instruction.type === 'delivery') {
      const passenger = this.instruction.passenger
      passenger.delivered(this.instruction.journeyId)
      this.cargo = this.cargo.filter((passenger) => passenger !== passenger)
    }
    this.instruction = this.instructions.shift()
    if (this.instruction) {
      if (this.instruction.waiting_time > 0) {
        this.simulate(false)
        const waitTime = virtualTime.timeInSeconds(
          this.instruction.waiting_time
        )
        await virtualTime.waitUntil(waitTime.valueOf())
      }
      return this.navigateNextJob()
    }
  }
}

module.exports = Taxi
