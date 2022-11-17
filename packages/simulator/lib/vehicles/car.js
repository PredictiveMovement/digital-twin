const Vehicle = require('./vehicle')

class Car extends Vehicle {
  constructor(args) {
    super(args)
    this.vehicleType = 'car'
    this.isPrivateCar = args.isPrivateCar
    this.co2PerKmKg = 0.1201 // NOTE: From a quick google. Needs to be verified.
  }
  canPickupBooking(booking) {
    return this.parcelCapacity > this.queue.length + this.cargo.length
  }
}

module.exports = Car
