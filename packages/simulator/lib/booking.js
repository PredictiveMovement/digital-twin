const EventEmitter = require('events')

class Booking extends EventEmitter {
  constructor(booking) {
    super()
    this.status = 'New'
    Object.assign(this, booking)
    this.position = this.pickup?.position
    this.on('error', err => console.error('car error', err))
  }

  queued(car) {
    this.queuedDateTime = new Date()
    this.status = 'Queued'
    this.emit('pickup', this)
    //console.log(`*** booking ${this.id}: ${this.status}`)
  }

  assigned(car) {
    this.assignedDateTime = new Date()
    this.car = car
    this.status = 'Assigned'
    this.emit('assigned', this)
    //console.log(`*** booking ${this.id}: ${this.status}`)
  }

  moved(position) {
    this.position = position
    this.emit('moved', this)
  }

  pickedUp(position, date) {
    this.pickupDateTime = date
    this.pickupPosition = position
    this.status = 'Picked up'
    this.emit('pickedup', this)
    //console.log(`*** booking ${this.id}: ${this.status}`)
  }

  delivered(position, date) {
    this.deliveredDateTime = date
    this.deliveredPosition = position
    this.status = 'Delivered'
    this.emit('delivered', this)
    console.log(`*** booking ${this.id}: ${this.status}`)
  }
}

module.exports = Booking