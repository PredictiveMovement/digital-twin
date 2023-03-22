const { Subject, range, from, merge, of } = require('rxjs')
const { shareReplay, mergeMap, share, catchError } = require('rxjs/operators')
const { dispatch } = require('./dispatch/dispatchCentral')
const Car = require('./vehicles/car')
const Truck = require('./vehicles/truck')
const Drone = require('./vehicles/drone')
const { randomize } = require('../simulator/address')
const Taxi = require('./vehicles/taxi')
const Position = require('./models/position')
const { error, info } = require('./log')
const { search } = require('./pelias')

const packagesPerPallet = 30 // this is a guesstimate
const vehicleTypes = {
  tungLastbil: {
    weight: 26 * 1000,
    capacity: 48 * packagesPerPallet,
    class: Truck,
  },
  medeltungLastbil: {
    weight: 16.5 * 1000,
    capacity: 18 * packagesPerPallet,
    class: Truck,
  },
  lättLastbil: {
    weight: 3.5 * 1000,
    capacity: 8 * packagesPerPallet, // TODO: is this number of pallets reasonable?
    class: Truck,
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
  taxi: {
    weight: 1.5 * 1000,
    capacity: 4,
    class: Taxi,
  },
}

class Fleet {
  constructor({
    name,
    marketshare,
    percentageHomeDelivery,
    vehicles,
    hub,
    hubAddress,
  }) {
    this.name = name
    this.marketshare = marketshare
    const hubPos = new Position(hub)
    if (!hubPos.isValid) {
      error(
        `Invalid hub position for fleet ${name}: ${hub}\n\n${
          new Error().stack
        }\n\n`
      )
    }
    this.hub = { position: hubPos.isValid ? hubPos : { lat: 0, lon: 0 } }

    this.percentageHomeDelivery = (percentageHomeDelivery || 0) / 100 || 0.15 // based on guestimates from workshop with transport actors in oct 2021
    this.percentageReturnDelivery = 0.1
    this.cars = from(Object.entries(vehicles)).pipe(
      mergeMap(([type, count]) =>
        range(0, count).pipe(
          mergeMap(() => {
            const Vehicle = vehicleTypes[type].class

            // NOTE: This should work because mergeMap is supposed to handle promises...
            // if (!!hubAddress) {
            //   return search(hubAddress)
            //     .then(({ position }) => {
            //       return of(
            //         new Vehicle({
            //           ...vehicleTypes[type],
            //           fleet: this,
            //           position: position,
            //         })
            //       )
            //     })
            //     .catch((err) => error('Fleet -> Cars', err))
            // }

            return of(
              new Vehicle({
                ...vehicleTypes[type],
                fleet: this,
                position: this.hub.position,
              })
            )
          }),
          catchError((err) => {
            error(
              `Error creating vehicle for fleet ${name}: ${err}\n\n${
                new Error().stack
              }\n\n`
            )
          })
        )
      ),
      shareReplay()
    )
    this.unhandledBookings = new Subject()
    this.manualDispatchedBookings = new Subject()
    this.dispatchedBookings = merge(
      this.manualDispatchedBookings,
      dispatch(this.cars, this.unhandledBookings) // TODO: Cluster bookings by pickup location.
    ).pipe(share())
  }

  async handleBooking(booking, car) {
    booking.fleet = this
    if (car) {
      this.manualDispatchedBookings.next(booking)
      return await car.handleBooking(booking)
    } else {
      info(`📦 Dispatching ${booking.id} to ${this.name}`)
      this.unhandledBookings.next(booking)
    }
    return booking
  }
}

module.exports = Fleet
