const moment = require('moment')
const {
  taxiDispatch,
  findBestRouteToPickupBookings,
} = require('../dispatch/taxiDispatch')
const { safeId } = require('../id')
const { info } = require('../log')
const Vehicle = require('../vehicles/vehicle')
const { virtualTime } = require('../virtualTime')
const { plan, taxiToVehicle, bookingToShipment } = require('../vroom')
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
    this.capacity = 4
    this.booking = true
    this.vehicleType = 'taxi'
    this.startPosition = startPosition
    this.co2PerKmKg = 0.1201 // NOTE: From a quick google. Needs to be verified.
    this.plan = []
    this.instruction = null
  }

  stopped() {
    super.stopped()
    this.instruction = this.plan.shift()
    this.booking = this.instruction?.booking
    this.status = this.instruction?.action || 'Ready'
    this.statusEvents.next(this)

    if (this.booking) {
      switch (this.action) {
        case 'Pickup':
          return this.navigateTo(this.booking.pickup.position)
        case 'Delivery':
          return this.navigateTo(this.booking.destination.position)
        default:
          return this.navigateTo(this.startPosition)
      }
    }
  }

  async pickup() {
    await this.waitAtPickup()
    info(
      'Pickup passenger',
      this.id,
      this.booking?.passenger?.name,
      this.currentPassengerCount
    )
    this.passengers = [...this.passengers, this.booking.passenger]
    this.currentPassengerCount++
    this.passengers.push(this.booking.passenger)
    this.cargoEvents.next(this)
    this.booking.pickedUp(this.position)
  }

  async dropOff() {
    info(
      'Dropoff passenger',
      this.id,
      this.booking?.passenger?.name,
      this.currentPassengerCount
    ) //TODO: NEVER GETS CALLED
    this.passengers = this.passengers.filter(
      (p) => p !== this.booking.passenger
    )
    this.cargoEvents.next(this)
    this.booking.delivered(this.position)

    this.currentPassengerCount--
  }

  handleBooking(booking) {
    super.handleBooking(booking)
    if (this.queue.length > 0) {
      findBestRouteToPickupBookings(this, this.queue).then((plan) => {
        this.plan = plan
        if (!this.instruction) {
          this.instruction = this.plan.shift()
          this.navigateTo(this.instruction.booking.pickup.position)
        }
      })
    }
    return booking
  }
}

module.exports = Taxi
