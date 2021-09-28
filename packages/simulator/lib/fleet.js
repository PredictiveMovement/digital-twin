const { Subject, ReplaySubject, range } = require('rxjs')
const { map, shareReplay, toArray } = require('rxjs/operators')
const { dispatch } = require('./dispatchCentral')
const Car = require('./car')
const { convertPosition } = require('../lib/distance')

class Fleet {
  constructor({ name, marketshare, numberOfCars, hub }) {
    this.name = name
    this.marketshare = marketshare
    this.cars = range(0, numberOfCars).pipe(
      map(i => new Car({ fleet: this, position: convertPosition(hub) })),
      shareReplay()
    )
    this.unhandledBookings = new Subject()
    this.dispatchedBookings = dispatch(this.cars, this.unhandledBookings)
  }

  handleBooking(booking) {
    booking.fleet = this
    this.unhandledBookings.next(booking)
    return booking
  }
}

module.exports = Fleet