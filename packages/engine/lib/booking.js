const EventEmitter = require('events')

class Booking extends EventEmitter {
  constructor (order) {
    super()
    this.statuses = []
    this.bookingDate = new Date()
    Object.assign(this, order)
    this.departure = Object.assign(
      pick(this.departure, ['streetName', 'streetNumber', 'city', 'entrance', 'zone']), 
      convertPosition(this.stopPoints[0]) // stopPoints have longitude and latitude, not always departure
    )
    this.on('error', err => console.error('car error', err))
  }

  updateStatus (status) {
    this.statuses.unshift(status)
    this.emit('status', status)
    return this
  }
}

module.exports = Booking

/* utils: */
function convertPosition (pos) {
  return {
    lon: pos.longitude || pos.lon || pos.lng,
    lat: pos.latitude || pos.lat
  }
}

function pick(o, ...props) {
    return Object.assign({}, ...props.map(prop => ({[prop]: o[prop]})));
}