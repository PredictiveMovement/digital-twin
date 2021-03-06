const EventEmitter = require('events')
const { random } = require('nanoid')
const { virtualTime } = require('../virtualTime')
const { safeId } = require('../id')

class Booking extends EventEmitter {
  position

  constructor(booking) {
    super()
    this.id = safeId()
    this.status = 'New'
    this.co2 = 0 //TODO: initialvärde?
    this.cost = 0 // startkostnad?
    this.distance = 0 //TODO: räkna med sträcka innan?
    this.weight = Math.random() * 10 // kg TODO: find reference kg
    Object.assign(this, booking)
    this.position = this.pickup?.position
    this.on('error', (err) => console.error('booking error', err))
  }

  queued(car) {
    this.queuedDateTime = virtualTime.time()
    this.status = 'Queued'
    this.car = car
    this.emit('queued', this)
    //console.log(`*** booking queued ${this.id}: ${this.status} with ${this.car.id}`)
  }

  assigned(car) {
    this.assignedDateTime = this.assignedDateTime || virtualTime.time()
    this.car = car
    this.status = 'Assigned'
    this.emit('assigned', this)
    //console.log(`*** booking ${this.id}: ${this.status}`)
  }

  moved(position, metersMoved, co2, cost) {
    this.position = position
    this.distance += metersMoved
    this.cost += cost
    this.co2 += co2
    this.emit('moved', this)
  }

  pickedUp(position, date = virtualTime.time()) {
    this.pickupDateTime = date
    this.pickupPosition = position
    this.status = 'Picked up'
    this.emit('pickedup', this)
    //console.log(`*** booking ${this.id}: ${this.status}`)
  }

  delivered(position, date = virtualTime.time()) {
    this.deliveredDateTime = date
    this.deliveredPosition = position
    this.deliveryTime =
      (date - (this.assignedDateTime || this.queuedDateTime)) / 1000
    this.status = 'Delivered'
    this.emit('delivered', this)
    // console.log(`*** booking ${this.id}: ${this.status}`)
  }
}

module.exports = Booking
