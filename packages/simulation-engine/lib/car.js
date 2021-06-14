const osrm = require('../lib/osrm')
const distance = require('./distance')
const interpolate = require('./interpolate')
const EventEmitter = require('events')
const findZone = require('../lib/zones')

class Car extends EventEmitter {
  constructor(id, position, status) {
    super()
    this.id = id
    this.position = position
    this.history = []
    this.status = status
    this.bookings = []
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
    console.log('positions', this.position, this.heading)
    this.heading = position
    return osrm
      .route(this.position, this.heading)
      .then((route) => {
        route.started = new Date()
        this.heading.route = route
        this.simulate(this.heading)
        return this
      })
      .catch(console.error)
  }

  handleBooking(booking) {
    console.debug('handleBooking')
    this.busy = true
    this.history.push({ status: 'handleBooking', date: new Date(), booking })
    this.booking = booking
    booking.car = this
    booking.bookingReceivedDateTime = new Date()
    this.navigateTo(booking.departure)
    return booking
  }

  pickup() {
    if (this.booking) {
      this.booking.departureDateTime = new Date()
      this.navigateTo(this.booking.destination)
    }
    this.emit('pickup', this)
  }

  dropOff() {
    if (this.booking) {
      this.busy = false
      this.booking.dropOffDateTime = new Date()
      this.booking = null
    }
    this.simulate(false)
    this.emit('dropoff', this)
  }


  offer(offer) {
    // Fake the approval offer
    return new Promise((resolve, reject) => {
      setTimeout((_) => {
        // TODO: send push notfication
        offer.car = this
        offer.approved = (Math.random() < 0.5 && new Date()) || undefined
        console.log(
          `Car #${this.id} ${offer.approved ? 'approved' : 'rejected'
          } the booking `
        )
        this.history.push({
          status: 'offered',
          date: new Date(),
          offer,
          approved: !!offer.approved,
        })
        resolve(offer)
      }, Math.random() * 10000)
    })
  }

  async updatePosition(position, date) {
    const moved = distance.haversine(position, this.position) >= 15 // meters
    const bearing = distance.bearing(position, this.position)
    this.position = position
    this.bearing = bearing

    this.lastPositions.push({ position: position, date: date || Date.now() })
    this.matchZone()
    if (moved) {
      /*
      Use this to match real world position to the road network
      if (this.lastPositions.length > 1 && date) {
        await this.matchPositionsToMap()
      }*/
      this.emit('moved', this)
      return this
    } else {
      // console.log(
      //   'stopped car + 1',
      //   distance.haversine(this.heading, this.position),
      //   this.id
      // )
      this.emit('stopped', this)
      if (distance.haversine(this.heading, this.position) <= 100) {
        if (this.booking && distance.haversine(this.position, this.booking.departure) < 15) {
          console.log('pickup')
          this.pickup()
        } else {
          console.log('dropOff')
          this.dropOff()
        }
      }
    }
  }

  matchZone() {
    const newZone = findZone(this.position)
    if (newZone && this.zone !== newZone[0]) {
      this.zone = newZone[0]
      this.emit('zone', this)
      // console.log(`car #${this.id} logged in to zone #${this.zone}`)
    }
  }

  matchPositionsToMap() {
    console.log('match')
    return osrm
      .match(
        this.lastPositions.filter(
          (pos) => pos.date > Date.now() - 4 * 60 * 1000
        )
      )
      .then((match) => {
        //console.log('matched route', ms, 'ms')
        const matching =
          match.matchings && match.matchings.length && match.matchings[0]
        if (!matching) return this
        const points = interpolate.points(matching)
        points.reverse().reduce((time, point) => {
          point.time = time - (point.duration * 1000 || 0) // hack: find purer way later
          point.speed = !point.meters
            ? 0
            : Math.round(point.meters / 1000 / (point.duration / 60 / 60))
          return point.time
        }, new Date(this.lastPositions.slice(-1).pop().date).valueOf())

        this.tail = points
          .map((point) => [...point.position, point.time, point.speed])
          .reverse() // reverse back
        this.speed = points.length ? points[0].speed : 0
        //this.tail = polyline.decode(matching.geometry)
        return this
      })
      .catch((err) => console.error('match', err))
  }
}

module.exports = Car
