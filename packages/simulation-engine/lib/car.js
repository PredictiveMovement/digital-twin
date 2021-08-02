const osrm = require('../lib/osrm')
const distance = require('./distance')
const interpolate = require('./interpolate')
const EventEmitter = require('events')

class Car extends EventEmitter {
  constructor(id, position, status) {
    super()
    this.id = id
    this.position = position
    this.history = []
    this.queue = []
    this.status = status
    this.lastPositions = []
    this.on('error', (err) => console.error('car error', err))
  }

  simulate(heading, timeMultiplier = 1) {
    clearInterval(this._interval)
    // this._timeStart = new Date()
    if (!heading) return
    this._interval = setInterval(() => {
      // const diff = new Date() - this._timeStart
      const newPosition = interpolate.route(heading.route, new Date())
      if (newPosition) this.updatePosition(newPosition)
    }, Math.random() * 3000)
  }

  navigateTo(position) {
    this.heading = position
    return osrm
      .route(this.position, this.heading)
      .then((route) => {
        route.started = new Date()
        this.heading.route = route
        this.simulate(this.heading)
        return this.heading
      })
      .catch(console.error)
  }

  handleBooking(booking) {
    this.history.push({ status: 'received_booking', date: new Date(), booking })
    if (!this.busy) {
      this.busy = true
      this.booking = booking
      this.navigateTo(booking.pickup)
      booking.car = this
    } else {
      this.booking.receivedDateTime = new Date()
      this.queue.push(booking)
    }
    return this
  }

  pickup() {
    console.log('inside pickup', this.booking)
    if (this.booking) {
      this.navigateTo(this.booking.destination)
      this.booking.pickupDateTime = new Date()
    }
    this.emit('pickup', this)

  }

  dropOff() {
    console.log('inside dropoff', this.booking)
    if (this.booking) {
      this.busy = false
      this.booking.dropOffDateTime = new Date()
      this.booking = null
      this.emit('dropoff', this)
    } 
    const nextBooking = this.queue.shift(this.queue)
    if (nextBooking) {
      this.handleBooking(nextBooking)
    } else {
      this.simulate(false) // chilla
    }
  }

  
  async updatePosition(position, date = Date.now()) {
    const lastPosition = this.lastPositions[this.lastPositions.length-1] || position
    const metersMoved = distance.haversine(lastPosition, position)
    const bearing = distance.bearing(lastPosition, position)
    const [km, h] = [(metersMoved / 1000), (date - lastPosition.date) / 1000 / 60 / 60]
    this.speed = km / h
    this.position = position
    this.bearing = bearing
    this.lastPositions.push({ ...position, date })
    if (this.speed > 10) {
      this.emit('moved', this)
    } else {
      this.emit('stopped', this)
      if (this.booking && !this.booking.pickupDateTime && distance.haversine(this.booking.pickup, this.position) < 50) this.pickup()
      if (this.booking && !this.booking.dropOffDateTime && distance.haversine(this.booking.destination, this.position) < 50) this.dropOff()
    }
  }
}

module.exports = Car
