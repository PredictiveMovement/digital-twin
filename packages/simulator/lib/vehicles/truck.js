const Vehicle = require('./vehicle')

class Truck extends Vehicle {
  constructor(args) {
    super(args)
    this.vehicleType = 'car'
    this.isPrivateCar = false
    this.co2PerKmKg = 0.1201 // NOTE: From a quick google. Needs to be verified.
    this.parcelCapacity = args.capacity
  }

  canPickupBooking(booking) {
    return this.parcelCapacity > this.queue.length + this.cargo.length
  }
}

module.exports = Truck
