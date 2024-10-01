// recycleTruck.js

const { info } = require('../log')
const { virtualTime } = require('../virtualTime') // Import the instance directly
const Vehicle = require('./vehicle')

class RecycleTruck extends Vehicle {
  constructor(args) {
    super(args)
    this.vehicleType = 'recycleTruck'
    this.co2PerKmKg = 0.000065 // NOTE: From a quick google. Needs to be verified.
    this.parcelCapacity = args.parcelCapacity

    this.position = args.position
    this.startPosition = args.startPosition || args.position

    this.id = args.id
    this.recyclingTypes = args.recyclingTypes
  }

  canHandleBooking(booking) {
    const canHandleRecyclingType = this.recyclingTypes.includes(
      booking.recyclingType
    )
    const hasCapacity = this.cargo.length < this.parcelCapacity
    return canHandleRecyclingType && hasCapacity
  }

  async waitAtPickup() {
    const minutes = 1.5 * Math.random()
    await virtualTime.wait(minutes * 60 * 1000) // Wait for up to 1.5 virtual minutes
  }

  async pickup() {
    if (this._disposed) return

    if (this.booking && this.booking.pickup) {
      this.booking.pickedUp(this.position)
      this.cargo.push(this.booking)
      this.cargoEvents.next(this)

      if (this.queue.length > 0) {
        this.booking = this.queue.shift()
        this.status = 'toPickup'
        this.statusEvents.next(this)
        this.navigateTo(this.booking.pickup.position)
      } else {
        this.status = 'toDelivery'
        this.statusEvents.next(this)
        this.navigateTo(this.fleet.hub.position)
      }
    }
  }

  dropOff() {
    info(`RecycleTruck ${this.id} dropping off all cargo at hub`)
    this.cargo.forEach((booking) => {
      booking.delivered(this.position)
    })
    this.cargo = []
    this.cargoEvents.next(this)
    this.status = 'ready'
    this.booking = null
    this.statusEvents.next(this)
  }
}

module.exports = RecycleTruck
