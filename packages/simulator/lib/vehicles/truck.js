const { from } = require('rxjs')
const { findBestRouteToPickupBookings } = require('../dispatch/truckDispatch')
const { info } = require('../log')
const Vehicle = require('./vehicle')

class Truck extends Vehicle {
  constructor(args) {
    super(args)
    this.vehicleType = 'car'
    this.isPrivateCar = false
    this.co2PerKmKg = 0.1201 // NOTE: From a quick google. Needs to be verified.
    this.parcelCapacity = args.capacity

    this.position = args.position
    this.startPosition = args.startPosition || args.position
  }

  async pickNextInstructionFromPlan() {
    this.instruction = this.plan.shift()
    this.booking = this.instruction?.booking
    this.status = this.instruction?.action || 'ready'
    this.statusEvents.next(this)
    switch (this.status) {
      case 'pickup':
        return this.navigateTo(this.booking.pickup.position)
      case 'delivery':
        return this.navigateTo(this.booking.destination.position)
      default:
        return this.navigateTo(this.startPosition)
    }
  }

  stopped() {
    super.stopped()
    if (this.plan) this.pickNextInstructionFromPlan()
  }

  async pickup() {
    info('Pickup cargo', this.id, this.booking.id)
    // this.cargo = [...this.cargo, this.booking?.passenger]
    this.cargo.push(this.booking)
    this.cargoEvents.next(this)
    this.booking.pickedUp(this.position)
  }

  async dropOff() {
    info('Unload cargo', this.id, this.booking.id)
    this.cargo = this.cargo.filter((p) => p !== this.booking)
    this.cargoEvents.next(this)
    this.booking.delivered(this.position)
  }

  async handleBooking(booking) {
    await super.handleBooking(booking)

    clearTimeout(this._timeout)
    this._timeout = setTimeout(async () => {
      this.plan = await findBestRouteToPickupBookings(
        this,
        [this.booking, ...this.queue].filter((f) => f)
      )

      if (!this.instruction) await this.pickNextInstructionFromPlan()
    }, 2000)

    return booking
  }

  async waitAtPickup() {
    return // NOTE: Trucks don't wait at pickup
  }
}

module.exports = Truck
