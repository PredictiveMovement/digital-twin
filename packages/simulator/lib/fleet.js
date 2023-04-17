const { Subject, range, from, merge, of, firstValueFrom } = require('rxjs')
const {
  shareReplay,
  mergeMap,
  share,
  catchError,
  first,
} = require('rxjs/operators')
const { dispatch } = require('./dispatch/dispatchCentral')
const Car = require('./vehicles/car')
const Truck = require('./vehicles/truck')
const Drone = require('./vehicles/drone')
const Taxi = require('./vehicles/taxi')
const Bus = require('./vehicles/bus')
const Position = require('./models/position')
const { error, debug } = require('./log')

const packagesPerPallet = 30 // this is a guesstimate
const vehicleTypes = {
  tungLastbil: {
    weight: 26 * 1000,
    parcelCapacity: 48 * packagesPerPallet,
    class: Truck,
  },
  medeltungLastbil: {
    weight: 16.5 * 1000,
    parcelCapacity: 18 * packagesPerPallet,
    class: Truck,
  },
  lättLastbil: {
    weight: 3.5 * 1000,
    parcelCapacity: 8 * packagesPerPallet, // TODO: is this number of pallets reasonable?
    class: Truck,
  },
  bil: {
    weight: 1.5 * 1000,
    parcelCapacity: 25,
    class: Car,
  },
  drönare: {
    weight: 5,
    parcelCapacity: 1,
    class: Drone,
  },
  taxi: {
    weight: 1.5 * 1000,
    passengerCapacity: 4,
    class: Taxi,
  },
  bus: {
    weight: 10 * 1000,
    passengerCapacity: 50,
    class: Bus,
  },
}

class Fleet {
  constructor({
    name,
    marketshare,
    percentageHomeDelivery,
    vehicles,
    hub,
    type,
    kommun,
  }) {
    this.name = name
    this.type = type
    this.marketshare = marketshare
    this.hub = { position: new Position(hub) }

    this.percentageHomeDelivery = (percentageHomeDelivery || 0) / 100 || 0.15 // based on guestimates from workshop with transport actors in oct 2021
    this.percentageReturnDelivery = 0.1
    this.kommun = kommun
    this.cars = from(Object.entries(vehicles)).pipe(
      mergeMap(([type, count]) =>
        range(0, count).pipe(
          mergeMap(() => {
            const Vehicle = vehicleTypes[type].class

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
      dispatch(this.cars, this.unhandledBookings)
    ).pipe(share())
  }

  async canHandleBooking(booking) {
    return firstValueFrom(
      this.cars.pipe(
        first((car) => car.canHandleBooking(booking), false /* defaultValue */)
      )
    )
  }

  async handleBooking(booking, car) {
    booking.fleet = this
    if (car) {
      this.manualDispatchedBookings.next(booking)
      return await car.handleBooking(booking)
    } else {
      debug(`📦 Dispatching ${booking.id} to ${this.name}`)
      this.unhandledBookings.next(booking)
    }
    return booking
  }
}

module.exports = Fleet
