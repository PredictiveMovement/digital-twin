const { Subject, range, from, merge } = require('rxjs')
const { map, shareReplay, mergeMap } = require('rxjs/operators')
const { dispatch } = require('./dispatch/dispatchCentral')
const Car = require('./vehicles/car')
const Truck = require('./vehicles/truck')
const Drone = require('./vehicles/drone')
const { randomize } = require('../simulator/address')
const Taxi = require('./vehicles/taxi')
const Position = require('./models/position')
const {error} = require('./log')

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
  constructor({ name, marketshare, percentageHomeDelivery, vehicles, hub }) {
    this.name = name
    this.marketshare = marketshare
    const hubPos = new Position(hub)
    if(hubPos.valid) {
      error(`Invalid hub position for fleet ${name}: ${hub}\n\n${new Error().stack}\n\n`)
    }
    this.hub = { position: (hubPos.valid ? hubPos : { lat: 0, lon: 0 }) }
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
            }).catch((err) => {
              error(`Error creating vehicle for fleet ${name}: ${err}\n\n${new Error().stack}\n\n`)
            })
          )
        )
      ),
      shareReplay()
    )
    this.unhandledBookings = new Subject()
    this.manualDispatchedBookings = new Subject()
    this.dispatchedBookings = merge(
      this.manualDispatchedBookings,
      dispatch(this.cars, this.unhandledBookings).pipe(
        map(({ booking }) => booking)
      )
    )
  }

  async handleBooking(booking, car) {
    booking.fleet = this
    if (car) {
      this.manualDispatchedBookings.next(booking)
      return car.handleBooking(booking)
    } else {
      this.unhandledBookings.next(booking)
    }
    return booking
  }
}

module.exports = Fleet
