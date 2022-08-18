const EventEmitter = require('events')

const { safeId } = require('./../id')

class Journey extends EventEmitter {
  constructor({ pickup, destination, timeWindow, passenger }) {
    super()
    this.id = safeId()
    this.status = 'Väntar'
    this.pickup = pickup
    this.destination = destination
    this.timeWindow = timeWindow
    this.passenger = passenger

    this.emit('status', this.toObject(true))
  }

  setStatus(status) {
    this.status = status
    this.emit('status', this.toObject(true))
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
