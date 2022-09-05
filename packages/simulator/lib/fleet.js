const { Subject, ReplaySubject, range, from } = require('rxjs')
const { map, shareReplay, toArray, mergeMap } = require('rxjs/operators')
const { dispatch } = require('./dispatchCentral')
const { vehicleTypes } = require('./vehicles/vehicleTypes')
const { convertPosition } = require('../lib/distance')
const { randomize } = require('../simulator/address')

class Fleet {
  constructor({ name, marketshare, percentageHomeDelivery, vehicles, hub }) {
    this.name = name
    this.marketshare = marketshare
    this.hub = { position: convertPosition(hub) }
    this.percentageHomeDelivery = (percentageHomeDelivery || 0) / 100 || 0.15 // based on guestimates from workshop with transport actors in oct 2021
    this.percentageReturnDelivery = 0.1
    this.vehicles = from(Object.entries(vehicles)).pipe(
      mergeMap(([type, count]) =>
        range(0, count).pipe(
          mergeMap((i) =>
            randomize(this.hub.position, 20, 30).then((position) => {
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
    this.dispatchedBookings = dispatch(
      this.vehicles,
      this.unhandledBookings
    ).pipe(map(({ booking }) => booking))
  }

  handleBooking(booking) {
    booking.fleet = this
    this.unhandledBookings.next(booking)
    return booking
  }
}

module.exports = Fleet
