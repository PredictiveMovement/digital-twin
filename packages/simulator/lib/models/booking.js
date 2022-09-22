const { virtualTime } = require('../virtualTime')
const { safeId } = require('../id')

const { ReplaySubject } = require('rxjs')
class Booking {
  position

  constructor(booking) {
    super()
    Object.assign(this, booking)
    this.id = 'b-' + safeId()
    this.status = 'New'
    this.co2 = 0 //TODO: initialvärde?
    this.type = booking.type || booking.passenger ? 'passenger' : 'package'
    this.cost = 0 // startkostnad?
    this.distance = 0 //TODO: räkna med sträcka innan?
    this.weight = Math.random() * 10 // kg TODO: find reference kg
    this.passenger = booking.passenger
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
  }

  assign(car) {
    this.assigned = this.assigned || virtualTime.time()
    this.car = car
    this.status = 'Assigned'
    this.assignedEvents.next(this)
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
  }

  delivered(position, date = virtualTime.time()) {
    this.deliveredDateTime = date
    this.deliveredPosition = position
    this.deliveryTime = (date - (this.assigned || this.queued)) / 1000
    this.status = 'Delivered'
    this.deliveredEvents.next(this)
  }

  toObject() {
    return {
      id: this.id,
      status: this.status,
      type: this.type,
      co2: this.co2,
      cost: this.cost,
      distance: this.distance,
      weight: this.weight,
      position: this.position,
      pickup: this.pickup,
      destination: this.destination,
      pickupPosition: this.pickupPosition,
      deliveredPosition: this.deliveredPosition,
      pickupDateTime: this.pickupDateTime,
      deliveredDateTime: this.deliveredDateTime,
      deliveryTime: this.deliveryTime,
      queued: this.queued,
      assigned: this.assigned,
    }
  }
}

module.exports = Booking
