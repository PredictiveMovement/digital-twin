const EventEmitter = require('events')

class Passenger extends EventEmitter {
  constructor({ id, pickup, destination, name, position }) {
    super()
    this.id = id
    this.pickup = pickup
    this.destination = destination
    this.name = name
    this.position = position
    this.inCar = false

    // Aggregated values
    this.co2 = 0
    this.cost = 0
    this.distance = 0
    this.moveTime = 0 // Time on a vehicle.
    this.waitTime = 0 // Time waiting for a vehicle.
  }

  moved(position, metersMoved, co2, cost, moveTime) {
    this.position = position

    // Aggregate values
    this.co2 += co2
    this.cost += cost
    this.distance += metersMoved
    this.moveTime += moveTime

    this.emit('moved', this)
  }

  pickedUp() {
    this.inCar = true
    this.emit('pickedup', { id: this.id, position: this.position, inCar: true })
  }
  delivered() {
    this.inCar = false
    this.emit('delivered', {
      id: this.id,
      position: this.position,
      inCar: false,
    })
  }
}

module.exports = Passenger
