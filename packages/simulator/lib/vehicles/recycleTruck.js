const { findBestRouteToPickupBookings } = require('../dispatch/truckDispatch')
const { info, warn, debug } = require('../log')
const Vehicle = require('./vehicle')

class RecycleTruck extends Vehicle {
  constructor(args) {
    super(args)
    this.vehicleType = 'recycleTruck'
    this.isPrivateCar = false
    this.co2PerKmKg = 0.1201 // NOTE: From a quick google. Needs to be verified.
    this.parcelCapacity = args.parcelCapacity
    this.plan = []

    this.position = args.position
    this.startPosition = args.startPosition || args.position

    this.carId = args.carId
    this.recyclingType = args.recyclingType
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
        this.status = 'toPickup'
        return this.navigateTo(this.booking.pickup.position)
      case 'delivery':
        this.status = 'toDelivery'
        return this.navigateTo(this.booking.destination.position)
      case 'ready':
      case 'returning':
        this.status = 'ready'
        return
      default:
        warn('Unknown status', this.status, this.instruction)
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
    // this.simulate(false) // pause interpolation while we wait
    // await virtualTime.wait(60_000)
    if (!this.booking) return warn('No booking to pickup', this.id)
    if (this.cargo.indexOf(this.booking) > -1)
      return warn('Already picked up', this.id, this.booking.id)

    debug('Pickup cargo', this.id, this.booking.id)
    // this.cargo = [...this.cargo, this.booking?.passenger]
    this.cargo.push(this.booking)
    this.cargoEvents.next(this)
    this.booking.pickedUp(this.position)
  }

  async dropOff() {
    this.cargo = this.cargo.filter((p) => p !== this.booking)
    this.cargoEvents.next(this)
    this.booking.delivered(this.position)
  }

  canHandleBooking(booking) {
    if (booking.type !== 'recycle') return false
    const hasCapacity = this.cargo.length < this.parcelCapacity
    const isCorrectCar = booking.carId === this.carId
    return hasCapacity && isCorrectCar
  }

  async handleBooking(booking) {
    //console.log('🚛 Handling booking', booking.id)
    if (this.queue.indexOf(booking) > -1)
      throw new Error(
        `Booking ${booking.id} is already in the queue (${this.queue.indexOf(
          booking
        )})`
      )
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

module.exports = RecycleTruck
