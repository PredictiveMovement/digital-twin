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
    this.hub = {position: convertPosition(hub)}
    this.percentageHomeDelivery = 0.2
    this.percentageReturnDelivery = 0.1
    this.cars = range(0, numberOfCars).pipe(
      mergeMap(i => randomize(this.hub.position).then(position => new Car({ fleet: this, position }))),
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