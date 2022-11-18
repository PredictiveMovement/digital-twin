const { findBestRouteToPickupBookings } = require('../dispatch/taxiDispatch')
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
    this.passengers = []
    this.queue = []
    this.passengerCapacity = 4
    this.booking = true
    this.vehicleType = 'taxi'
    this.startPosition = startPosition || position
    this.co2PerKmKg = 0.1201 // NOTE: From a quick google. Needs to be verified.
    this.plan = []
    this.instruction = null
  }

  stopped() {
    super.stopped()
    this.pickNextInstructionFromPlan()
  }

  async pickNextInstructionFromPlan() {
    this.instruction = this.plan.shift()
    this.booking = this.instruction?.booking
    this.status = this.instruction?.action || 'ready'
    this.statusEvents.next(this)
    switch (this.status) {
      case 'pickup':
        await virtualTime.waitUntil(this.instruction.arrival)
        return this.navigateTo(this.booking.pickup.position)
      case 'delivery':
        await virtualTime.waitUntil(this.instruction.arrival)
        return this.navigateTo(this.booking.destination.position)
      default:
        return this.navigateTo(this.startPosition)
    }
  }

  async pickup() {
    info('Pickup passenger', this.id, this.booking?.passenger?.name)
    this.passengers = [...this.passengers, this.booking?.passenger]
    this.currentPassengerCount++
    this.passengers.push(this.booking.passenger)
    this.cargoEvents.next(this)
    this.booking.pickedUp(this.position)
  }

  async dropOff() {
    info('Dropoff passenger', this.id, this.booking?.passenger?.name)
    this.passengers = this.passengers.filter(
      (p) => p !== this.booking.passenger
    )
    this.cargoEvents.next(this)
    this.booking.delivered(this.position)

    this.currentPassengerCount--
  }

  async handleBooking(booking) {
    super.handleBooking(booking)
    this.plan = await findBestRouteToPickupBookings(this, [
      this.booking,
      ...this.queue,
    ])
    if (!this.instruction) this.pickNextInstructionFromPlan()
    return booking
  }
}

module.exports = Taxi
