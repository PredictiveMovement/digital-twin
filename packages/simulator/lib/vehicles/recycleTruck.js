const { info } = require('../log')
const { virtualTime } = require('../virtualTime') // Import the instance directly
const Vehicle = require('./vehicle')

class RecycleTruck extends Vehicle {
  constructor(args) {
    super(args)
    this.vehicleType = 'recycleTruck'
    this.co2PerKmKg = 0.000065 // NOTE: From a quick google. Needs to be verified.
    this.parcelCapacity = args.parcelCapacity || 300
    this.plan = []

    this.position = args.position
    this.startPosition = args.startPosition || args.position

    this.carId = args.carId
    this.id = args.id
    this.recyclingTypes = args.recyclingTypes
  }

  canHandleBooking(booking) {
    if (booking.type !== 'recycle') return false
    const hasCapacity = this.cargo.length < this.parcelCapacity
    const isCorrectCar = booking.carId === this.carId
    return hasCapacity && isCorrectCar
  }

  async waitAtPickup() {
    const minutes = 1.5 * Math.random()
    await virtualTime.wait(minutes * 60 * 1000) // Wait for 2 virtual minutes
  }

  async pickup() {
    if (this._disposed) return

    if (this.booking && this.booking.pickup) {
      // Lägg till bokningen i lasten
      this.booking.pickedUp(this.position)
      this.cargo.push(this.booking)
      this.cargoEvents.next(this)

      // Kontrollera om det finns fler hämtningar i kön
      if (this.queue.length > 0) {
        // Hämta nästa bokning
        this.booking = this.queue.shift()
        this.status = 'toPickup'
        this.statusEvents.next(this)
        this.navigateTo(this.booking.pickup.position)
      } else {
        // Inga fler hämtningar, åk till destinationen
        this.status = 'toDelivery'
        this.statusEvents.next(this)
        this.navigateTo(this.booking.destination.position)
      }
    }
  }

  dropOff() {
    info(`RecycleTruck ${this.id} dropping off all cargo at destination`)
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
