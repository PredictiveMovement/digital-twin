const { virtualTime } = require('../virtualTime')
const { safeId } = require('../id')

const { ReplaySubject } = require('rxjs')
class Booking {
  position

  constructor(booking) {
    this.id = safeId()
    this.status = 'New'
    this.co2 = 0 //TODO: initialvärde?
    this.cost = 0 // startkostnad?
    this.distance = 0 //TODO: räkna med sträcka innan?
    this.weight = Math.random() * 10 // kg TODO: find reference kg
    Object.assign(this, booking)
    this.position = this.pickup?.position
    this.queuedEvents = new ReplaySubject()
    this.pickedUpEvents = new ReplaySubject()
    this.assignedEvents = new ReplaySubject()
    this.deliveredEvents = new ReplaySubject()
  }
  queued(car) {
    this.queuedDateTime = virtualTime.time()
    this.status = 'Queued'
    this.car = car
    this.queuedEvents.next(this)
    //console.log(`*** booking queued ${this.id}: ${this.status} with ${this.car.id}`)
  }

  assigned(car) {
    this.assignedDateTime = this.assignedDateTime || virtualTime.time()
    this.car = car
    this.status = 'Assigned'
    this.assignedEvents.next(this)
    //console.log(`*** booking ${this.id}: ${this.status}`)
  }

  moved(position, metersMoved, co2, cost) {
    this.position = position
    this.distance += metersMoved
    this.cost += cost
    this.co2 += co2
  }

  pickedUp(position, date = virtualTime.time()) {
    this.pickupDateTime = date
    this.pickupPosition = position
    this.status = 'Picked up'
    this.pickedUpEvents.next(this)
    //console.log(`*** booking ${this.id}: ${this.status}`)
  }

  delivered(position, date = virtualTime.time()) {
    this.deliveredDateTime = date
    this.deliveredPosition = position
    this.deliveryTime =
      (date - (this.assignedDateTime || this.queuedDateTime)) / 1000
    this.status = 'Delivered'
    this.deliveredEvents.next(this)
    // console.log(`*** booking ${this.id}: ${this.status}`)
  }
}

module.exports = Booking
