const { virtualTime } = require('../virtualTime')
const { safeId } = require('../id')

const { ReplaySubject, merge } = require('rxjs')
class Booking {
  constructor(booking) {
    Object.assign(this, booking)
    this.id =
      `${
        booking.sender ? booking.sender.replace(/\&/g, '').toLowerCase() : 'b'
      }-` + safeId()
    this.status = 'New'
    this.co2 = 0 //TODO: initialvärde?
    this.passenger = booking.passenger
    this.type = booking.type
    this.cost = 0 // startkostnad?
    this.distance = 0 //TODO: räkna med sträcka innan?
    this.weight = Math.random() * 10 // kg TODO: find reference kg // TODO: passagerare väger mer..
    this.position = this.pickup?.position
    this.queuedEvents = new ReplaySubject()
    this.pickedUpEvents = new ReplaySubject()
    this.assignedEvents = new ReplaySubject()
    this.deliveredEvents = new ReplaySubject()
    this.statusEvents = merge(
      this.queuedEvents,
      this.assignedEvents,
      this.pickedUpEvents,
      this.deliveredEvents
    )
  }

  async queued(car) {
    this.queuedDateTime = await virtualTime.getTimeInMillisecondsAsPromise()
    this.status = 'Queued'
    this.car = car
    this.queuedEvents.next(this)
  }

  async assign(car) {
    this.assigned =
      this.assigned || (await virtualTime.getTimeInMillisecondsAsPromise())
    this.car = car
    this.status = 'Assigned'
    this.assignedEvents.next(this)
  }

  async moved(position, metersMoved, co2, cost) {
    this.position = position
    this.passenger?.moved(
      position,
      metersMoved,
      co2,
      cost,
      (await virtualTime.getTimeInMillisecondsAsPromise()) -
        this.pickedUpDateTime
    )
    this.distance += metersMoved
    this.cost += cost
    this.co2 += co2
  }

  async pickedUp(
    position,
    date = virtualTime.getTimeInMillisecondsAsPromise()
  ) {
    date = await date
    this.pickupDateTime = date
    this.pickupPosition = position
    this.status = 'Picked up'
    this.pickedUpEvents.next(this)
  }

  async delivered(
    position,
    date = virtualTime.getTimeInMillisecondsAsPromise()
  ) {
    date = await date
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
      sender: this.sender,
      position: this.position?.toObject(),
      pickup: this.pickup,
      carId: this.car?.id,
      destination: this.destination,
      pickupPosition: this.pickupPosition?.toObject(),
      deliveredPosition: this.deliveredPosition?.toObject(),
      pickupDateTime: this.pickupDateTime,
      deliveredDateTime: this.deliveredDateTime,
      deliveryTime: this.deliveryTime,
      queued: this.queued,
      assigned: this.assigned,
    }
  }
}

module.exports = Booking
