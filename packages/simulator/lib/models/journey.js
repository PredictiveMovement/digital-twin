const { safeId } = require('./../id')
const { ReplaySubject } = require('rxjs')

class Journey {
  constructor({ pickup, destination, timeWindow, passenger }) {
    this.id = safeId()
    this.status = 'Väntar'
    this.pickup = pickup
    this.destination = destination
    this.timeWindow = timeWindow
    this.passenger = passenger

    this.statusEvents = new ReplaySubject()
    this.statusEvents.next(this)
  }

  setStatus(status) {
    this.status = status
    this.statusEvents.next(this)
  }

  toObject(includePassenger = false) {
    const obj = {
      id: this.id,
      status: this.status,
      pickup: this.pickup,
      destination: this.destination,
      timeWindow: this.timeWindow,
    }
    if (includePassenger) {
      obj.passenger = this.passenger.toObject(false)
    }
    return obj
  }
}

module.exports = Journey
