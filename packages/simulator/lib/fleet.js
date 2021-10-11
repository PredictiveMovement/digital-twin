const { Subject, ReplaySubject, range, from } = require('rxjs')
const { map, shareReplay, toArray, mergeMap } = require('rxjs/operators')
const { dispatch } = require('./dispatchCentral')
const Car = require('./car')
const { convertPosition } = require('../lib/distance')
const { randomize } = require('../simulator/address')

const packagesPerPallet = 30 // this is a guesstimate
const vehicleTypes = {
  "tungLastbil": {
    weight: 26, // in 1000 kgs
    capacity: 48 * packagesPerPallet
  }, 
  "medeltungLastbil": {
    weight: 16.5,
    capacity: 18 * packagesPerPallet
  }, 
  "lättLastbil": {
    weight: 3.5,
    capacity: 250
  }, 
  "bil": {
    weight: 1.5,
    capacity: 25
  }
}

class Fleet {
  constructor({ name, marketshare, vehicles, hub }) {
    this.name = name
    this.marketshare = marketshare
    this.hub = {position: convertPosition(hub)}
    this.percentageHomeDelivery = 0.15 // based on guestimates from workshop with transport actors in oct 2021
    this.percentageReturnDelivery = 0.1
    this.cars = from(Object.entries(vehicles)).pipe(
      mergeMap(([type, count]) => range(0, count).pipe(
        mergeMap(i => randomize(this.hub.position).then(position => new Car({...vehicleTypes[type], fleet: this, position }))),
      )),
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