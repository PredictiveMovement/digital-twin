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
    this.status = status
    this.lastPositions = []
    this.on('error', (err) => console.error('car error', err))
  }

  simulate(heading) {
    clearInterval(this._interval)
    if (!heading) return
    this._interval = setInterval(() => {
      const newPosition = interpolate.route(heading.route, new Date())
      if (newPosition) this.updatePosition(newPosition)
    }, Math.random() * 3000)
  }

  navigateTo(position) {
    console.log(
      'navigateFromTo meters',
      distance.haversine(position, this.position)
    )
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

  pickup(trip) {
    this.busy = true
    this.history.push({ status: 'pickup', date: new Date(), trip })
    this.trip = trip
    trip.car = this
    trip.pickupDateTime = new Date(Date.now() + trip.estimate.tta * 1000)
    this.pickupLocation = trip.booking.departure
    return trip
  }

  dropOff() {
    console.log('inside dropoff', this.trip)
    if (this.trip) {
      this.busy = false
      this.trip.dropOffDateTime = new Date()
      this.trip = null
    }
    this.simulate(false)
    this.emit('dropoff', this)
  }

  
  async updatePosition(position, date = Date.now()) {
    const lastPosition = this.lastPositions[this.lastPositions.length-1] || position
    const metersMoved = distance.haversine(lastPosition, position)
    const bearing = distance.bearing(lastPosition, position)
    const speed = (metersMoved / 1000) / (lastPosition.date - date) / 60 / 60
    this.position = position
    this.bearing = bearing
    this.speed = speed
    this.lastPositions.push({ position, date })
    if (metersMoved > 10) {
      this.emit('moved', this)
    } else {
      this.emit('stopped', this)
      if (distance.haversine(this.heading, this.position) < 50) this.dropOff()
    }
  }
}

module.exports = Car
