const { Subject, ReplaySubject, range } = require('rxjs')
const { map, shareReplay, toArray, mergeMap } = require('rxjs/operators')
const { dispatch } = require('./dispatchCentral')
const Car = require('./car')
const { convertPosition } = require('../lib/distance')
const { randomize } = require('../simulator/address')

class Fleet {
  constructor({ name, marketshare, numberOfCars, hub }) {
    this.name = name
    this.marketshare = marketshare
    this.cars = range(0, numberOfCars).pipe(
      mergeMap(i => randomize(convertPosition(hub)).then(position => new Car({ fleet: this, position }))),
      shareReplay()
    )
    this.unhandledBookings = new Subject()
    this.dispatchedBookings = dispatch(this.cars, this.unhandledBookings).pipe(map(({booking}) => booking))
  }

  handleBooking(booking) {
    booking.fleet = this
    this.unhandledBookings.next(booking)
    return booking
  }
}

module.exports = Fleet