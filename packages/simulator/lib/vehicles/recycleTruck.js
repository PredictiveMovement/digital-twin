// recycleTruck.js

const { info } = require('../log')
const { virtualTime } = require('../virtualTime') // Import the instance directly
const Vehicle = require('./vehicle')
const Position = require('../models/position')

class RecycleTruck extends Vehicle {
  constructor(args) {
    super(args)
    this.vehicleType = 'recycleTruck'
    this.co2PerKmKg = 0.000065 // NOTE: From a quick google. Needs to be verified.
    this.parcelCapacity = args.parcelCapacity

    this.position = args.position
    this.startPosition = args.startPosition || args.position

    this.id = args.id
    this.carId = args.carId
    this.recyclingTypes = args.recyclingTypes
    this.destination = args.destination
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

    if (this.queue.length > 0) {
      const matchingBooking = this.bookings.find(
        (booking) => booking.bookingId === this.queue[0].id
      )
      if (!matchingBooking) return

      this.booking = matchingBooking
      this.booking.pickedUp(this.position)
      this.cargo.push(matchingBooking)
      this.cargoEvents.next(this)

      this.queue.shift()

      this.status = 'toPickup'
      this.statusEvents.next(this)

      this.navigateTo(
        new Position({
          lat: this.queue[0].location[1],
          lng: this.queue[0].location[0],
        })
      )
    } else {
      this.status = 'toDelivery'
      this.statusEvents.next(this)
      this.navigateTo(this.fleet.hub.position)
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

  setRoute(route, bookings) {
    this.bookings = bookings
    this.queue = route.steps
    this.status = 'toPickup'
    this.statusEvents.next(this)
    this.processRoute()
  }

  async processRoute() {
    for (const step of this.queue) {
      if (
        step.type === 'start' ||
        step.type === 'end' ||
        step.type === 'delivery'
      )
        continue
      if (step.type === 'pickup') {
        await this.pickup()
      }
    }

    this.status = 'toPickup'
    this.statusEvents.next(this)
  }

  stopped() {
    this.speed = 0
    this.statusEvents.next(this)
    if (this.queue.length > 0) {
      if (this.booking) {
        this.booking.pickedUp(this.position)
      }
      this.simulate(false)
      if (this.status === 'toPickup') {
        return this.pickup()
      }
    }
  }
}

module.exports = RecycleTruck
