const { findBestRouteToPickupBookings } = require('../dispatch/truckDispatch')
const { info } = require('../log')
const Vehicle = require('./vehicle')
const { virtualTime } = require('../virtualTime')

class Truck extends Vehicle {
  constructor(args) {
    super(args)
    this.vehicleType = 'car'
    this.isPrivateCar = false
    this.co2PerKmKg = 0.1201 // NOTE: From a quick google. Needs to be verified.
    this.parcelCapacity = args.capacity
    this.plan = []

    this.position = args.position
    this.startPosition = args.startPosition || args.position
  }

  async pickNextInstructionFromPlan() {
    this.instruction = this.plan.shift()
    this.booking = this.instruction?.booking
    this.status = this.instruction?.action || 'returning'
    this.statusEvents.next(this)
    switch (this.status) {
      case 'start':
        return this.navigateTo(this.startPosition)
      case 'pickup':
        return this.navigateTo(this.booking.pickup.position)
      case 'delivery':
        return this.navigateTo(this.booking.destination.position)
      case 'ready':
      case 'returning':
        this.status = 'ready'
        return
      default:
        console.log('Unknown status', this.status, this.instruction)
        if (!this.plan.length) this.status = 'returning'
        return this.navigateTo(this.startPosition)
    }
  }

  stopped() {
    super.stopped()
    this.pickNextInstructionFromPlan()
  }

  async pickup() {
    // Wait 1 minute to simulate loading/unloading
    await virtualTime.wait(60_000)

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
    this.queue.push(booking)
    booking.assign(this)
    booking.queued(this)

    clearTimeout(this._timeout)
    this._timeout = setTimeout(async () => {
      this.plan = await findBestRouteToPickupBookings(this, this.queue)

      if (!this.instruction) await this.pickNextInstructionFromPlan()
    }, 2000)

    return booking
  }

  async waitAtPickup() {
    return // NOTE: Trucks don't wait at pickup
  }
}

module.exports = Truck
