const Vehicle = require('./vehicle')
const { virtualTime } = require('../virtualTime')
const interpolate = require('../interpolate')
const { haversine } = require("../distance")

class Drone extends Vehicle {
  constructor({maxSpeed = 80, position, ...vehicle}) {
    super(vehicle)
    this.maxSpeed = maxSpeed // km/h
    this.position = this.origin = position
    this.co2PerKmKg = 0.001
    this.maximumWeight = 10 // kg
    this.range = 100_000 // meters
    this.altitude = 0
    this.maximumAltitude = 800
    this.dropoffTime = 600 // seconds
  }

  simulate(route) {
    clearInterval(this._interval)
    if (!route) return
    if (virtualTime.timeMultiplier === Infinity) return this.updatePosition(route) // teleport mode
    this._interval = setInterval(() => {
      if (virtualTime.timeMultiplier === 0) return // don't update position when time is stopped
      const newPosition = interpolate.route(route, this.time()) ?? this.heading
      this.updatePosition(newPosition)
      const metersFromStart = haversine(this.position, this.startingFrom)
      this.altitude = Math.min(this.maximumAltitude, this.ema, metersFromStart)
    }, 100)
  }

  canPickupBooking(booking) {
    if (this.weight + booking.weight > this.maximumWeight) return false
    if (haversine(this.position, booking.pickup.position) + haversine(booking.pickup.position, booking.destination.position) > this.range) return false
    return this.capacity > (this.queue.length + this.cargo.length)
  }


  navigateTo(position) {
    this.startingFrom = this.position
    this.heading = position
    if (!position) debugger
    const distance = haversine(this.position, position) // meters
    const km = distance / 1000
    const h = ((km) / (this.maxSpeed))
    const duration = h * 60 * 60
    this.route = {
      started: this.time(),
      distance,
      duration,
      geometry: {
        coordinates: [this.position, position, position]
      },
      legs: [{
        annotation: {
          distance: [distance, 0],
          duration: [duration, this.dropoffTime],
        }
      }]
    }
    this.simulate(this.route)

    return Promise.resolve(this.heading)
  }
}

module.exports = Drone