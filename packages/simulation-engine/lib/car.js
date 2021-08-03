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

  simulate(heading, timeMultiplier = 300) {
    clearInterval(this._interval)
    this._timeStart = Date.now()
    this._timeMultiplier = timeMultiplier
    if (!heading) return
    this._interval = setInterval(() => {
      const diff = Date.now() - this._timeStart
      const newPosition = interpolate.route(heading.route, Date.now() + diff * timeMultiplier)
      this.updatePosition(newPosition ?? heading)
      // console.log('interval', this.ema, this.speed, this.id)
    }, Math.random() * 300)
  }

  navigateTo(position) {
    this.heading = position
    return osrm
      .route(this.position, this.heading)
      .then((route) => {
        route.started = new Date()
        this.heading.route = route
        this.simulate(this.heading)
        console.log(`Car#${this.id}: heading to`, this.heading)
        return this.heading
      })
      .catch(console.error)
  }

  handleBooking(booking) {
    this.history.push({ status: 'received_booking', date: new Date(), booking })
    if (!this.busy) {
      this.busy = true
      this.booking = booking
      this.booking.car = this
      this.navigateTo(booking.pickup.position)
    } else {
      this.booking.receivedDateTime = new Date()
      this.queue.push(booking)
      console.log(`*** Car#${this.id}: queued ${this.queue.length} bookings`)
    }
    return booking
  }

  pickup() {
    console.log(`Car#${this.id}: inside pickup`, this.booking)
    if (this.booking) {
      this.navigateTo(this.booking.destination.position)
      this.booking.pickupDateTime = new Date()
    }
    this.emit('pickup', this)

  }

  dropOff() {
    console.log(`Car#${this.id}: inside dropoff`, this.booking)
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
    const metersMoved = distance.haversine(lastPosition, position) ?? 0
    const bearing = distance.bearing(lastPosition, position)
    const [km, h] = [(metersMoved / 1000), (date - lastPosition.date) / 1000 / 60 / 60]
    this.speed = Math.round((km / h / (this._timeMultiplier || 1)) || 0)
    this.position = position
    this.bearing = bearing
    this.lastPositions.push({ ...position, date })
    this.ema = distance.haversine(this.heading, this.position) || 0
    if (this.speed > 10 || this.ema > 100) {
      this.emit('moved', this)
      console.log('*** moved', this.ema, this.speed)
    } else {
      this.emit('stopped', this)
      this.simulate(false)
      console.log(`Car#${this.id}: stopped`, this.id, this.booking?.pickup, this.ema, this.speed)
      if (this.booking && distance.haversine(this.booking.pickup.position, this.position) < 150) this.pickup()
      if (this.booking && distance.haversine(this.booking.destination.position, this.position) < 150) this.dropOff()
    }
  }
}
 
module.exports = Car
