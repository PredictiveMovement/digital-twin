const { Subject, ReplaySubject, range, from } = require('rxjs')
const { map, shareReplay, toArray, mergeMap } = require('rxjs/operators')
const { dispatch } = require('./dispatch/dispatchCentral')
const Car = require('./vehicles/car')
const Drone = require('./vehicles/drone')
const { convertPosition } = require('../lib/distance')
const { randomize } = require('../simulator/address')
const pelias = require('./pelias')

const packagesPerPallet = 30 // this is a guesstimate
const vehicleTypes = {
  tungLastbil: {
    weight: 26 * 1000,
    capacity: 48 * packagesPerPallet,
    class: Car,
  },
  medeltungLastbil: {
    weight: 16.5 * 1000,
    capacity: 18 * packagesPerPallet,
    class: Car,
  },
  lättLastbil: {
    weight: 3.5 * 1000,
    capacity: 8 * packagesPerPallet, // TODO: is this number of pallets reasonable?
    class: Car,
  },
  bil: {
    weight: 1.5 * 1000,
    capacity: 25,
    class: Car,
  },
  drönare: {
    weight: 5,
    capacity: 1,
    class: Drone,
  },
}

class Fleet {
  constructor({ name, marketshare, percentageHomeDelivery, vehicles, hub }) {
    this.name = name
    this.marketshare = marketshare
    this.hub = {
      position: hub.length
        ? convertPosition(hub)
        : pelias.search(hub).then((position) => (this.hub = position)),
    }
    this.percentageHomeDelivery = (percentageHomeDelivery || 0) / 100 || 0.15 // based on guestimates from workshop with transport actors in oct 2021
    this.percentageReturnDelivery = 0.1
    this.cars = from(Object.entries(vehicles)).pipe(
      mergeMap(([type, count]) =>
        range(0, count).pipe(
          mergeMap(() =>
            randomize(this.hub.position).then((position) => {
              const Vehicle = vehicleTypes[type].class
              return new Vehicle({
                ...vehicleTypes[type],
                fleet: this,
                position,
              })
            })
          )
        )
      ),
      shareReplay()
    )
    this.unhandledBookings = new Subject()
    this.dispatchedBookings = dispatch(this.cars, this.unhandledBookings).pipe(
      map(({ booking }) => booking)
    )
  }

  handleBooking(booking) {
    booking.fleet = this
    this.unhandledBookings.next(booking)
    return booking
  }
}

module.exports = Fleet
