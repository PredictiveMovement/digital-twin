const EventEmitter = require('events')

class Booking extends EventEmitter {
  constructor (booking) {
    super()
    Object.assign(this, booking)
    this.on('error', err => console.error('car error', err))
  }

  queued(car){
    this.queuedDateTime = new Date()
    this.status = 'Queued'
    this.emit('pickup', this)
    console.log(`*** booking ${this.id}: ${this.status}`)
  }

  assigned(car) {
    this.assignedDateTime = new Date()
    this.car = car
    this.status = 'Assigned'
    this.emit('assigned', this)
    console.log(`*** booking ${this.id}: ${this.status}`)
  }

  pickedUp(position){
    this.pickupDateTime = new Date()
    this.pickupPosition = position
    this.status = 'Picked up'
    this.emit('pickup', this)
    console.log(`*** booking ${this.id}: ${this.status}`)
  }

  droppedOff(position) {
    this.dropoffDateTime = new Date()
    this.dropoffPosition = position
    this.status = 'Delivered'
    this.emit('dropoff', this)
    console.log(`*** booking ${this.id}: ${this.status}`)
  }
}

module.exports = Booking