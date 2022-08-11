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
    this.distance = 0
    this.co2 = 0
    this.cost = 0
  }

  moved(position, metersMoved, co2, cost) {
    this.position = position
    this.distance += metersMoved
    this.cost += cost
    this.co2 += co2
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
