const { Subject, range, from, merge, of, firstValueFrom } = require('rxjs')
const {
  shareReplay,
  mergeMap,
  share,
  catchError,
  first,
} = require('rxjs/operators')
const { dispatch } = require('./dispatch/dispatchCentral')
const GarbageTruck = require('./vehicles/garbageTruck')
const Position = require('./models/position')
const { error, debug } = require('./log')

const vehicleTypes = {
  garbageTruck: {
    weight: 10 * 1000,
    parcelCapacity: 500,
    class: GarbageTruck,
  }
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
