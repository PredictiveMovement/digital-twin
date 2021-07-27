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

  
  async updatePosition(position, date) {
    const moved = distance.haversine(position, this.position) > 10 // meters
    const bearing = distance.bearing(position, this.position)
    this.position = position
    this.bearing = bearing
    this.lastPositions.push({ position: position, date: date || Date.now() })
    if (moved) {
      this.emit('moved', this)
    } else {
      this.emit('stopped', this)
      if (distance.haversine(this.heading, this.position) < 50) {
        this.dropOff()
      }
    }
  }
}

module.exports = Car
