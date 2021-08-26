const EventEmitter = require('events')
const { virtualTime } = require('../lib/virtualTime')
const { safeId } = require('./id')

class Booking extends EventEmitter {
  constructor(booking) {
    super()
    this.id = safeId()
    this.status = 'New'
    Object.assign(this, booking)
    this.position = this.pickup?.position
    this.on('error', err => console.error('booking error', err))
  }

  queued(car) {
    this.queuedDateTime = virtualTime.time()
    this.status = 'Queued'
    this.car = car
    this.emit('queued', this)
    console.log(`*** booking queued ${this.id}: ${this.status} with ${this.car.id}`)
  }

  assigned(car) {
    this.assignedDateTime = virtualTime.time()
    this.car = car
    this.status = 'Assigned'
    this.emit('assigned', this)
    console.log(`*** booking ${this.id}: ${this.status}`)
  }

  moved(position) {
    this.position = position
    this.emit('moved', this)
  }

  pickedUp(position, date = virtualTime.time()) {
    this.pickupDateTime = date
    this.pickupPosition = position
    this.status = 'Picked up'
    this.emit('pickedup', this)
    console.log(`*** booking ${this.id}: ${this.status}`)
  }

  delivered(position, date = virtualTime.time()) {
    this.deliveredDateTime = date
    this.deliveredPosition = position
    this.deliveryTime = (date - (this.assignedDateTime || this.queuedDateTime)) / 1000
    this.status = 'Delivered'
    this.emit('delivered', this)
    // console.log(`*** booking ${this.id}: ${this.status}`)
  }
}

module.exports = Booking