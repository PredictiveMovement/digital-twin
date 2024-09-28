const { Subject, from, merge, of, firstValueFrom } = require('rxjs')
const {
  shareReplay,
  mergeMap,
  share,
  tap,
  filter,
  first,
  groupBy,
  map,
  find,
} = require('rxjs/operators')
const { dispatch } = require('./dispatch/dispatchCentral')
const RecycleTruck = require('./vehicles/recycleTruck')
const Position = require('./models/position')
const { error, info, debug } = require('./log')
const telge = require('../streams/orders/telge')

const vehicleTypes = {
  recycleTruck: {
    weight: 10 * 1000,
    parcelCapacity: 300,
    class: RecycleTruck,
  },
}

class Fleet {
  constructor({
    name,
    marketshare,
    percentageHomeDelivery,
    hub,
    type,
    municipality,
  }) {
    this.name = name
    this.type = type
    this.marketshare = marketshare
    this.hub = { position: new Position(hub) }

    this.percentageHomeDelivery = (percentageHomeDelivery || 0) / 100 || 0.15 // based on guestimates from workshop with transport actors in oct 2021
    this.percentageReturnDelivery = 0.1
    this.municipality = municipality

    const vehicleIds = telge.pipe(
      filter((booking) => booking.carId),
      groupBy((booking) => booking.carId),
      mergeMap((group) => group.pipe(first())),
      map((booking) => [booking.carId, booking])
    )

    // Create vehicles based on the JSON data
    this.cars = vehicleIds.pipe(
      mergeMap(([id, { recyclingType }]) => {
        const Vehicle = vehicleTypes['recycleTruck'].class

        if (!Vehicle) {
          error(`Unknown vehicle class for vehicle ID ${id}`)
          return of(null)
        }

        return of(
          new Vehicle({
            ...vehicleTypes['recycleTruck'],
            id,
            fleet: this,
            position: this.hub.position,
            recyclingType,
          })
        )
      }),
      tap((car) =>
        info(
          `🚛 Fleet ${this.name} created vehicle ${car.id} (${car.recyclingType})`
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
    return true // We can handle all bookings - we only use one fleet in this simulation
    return firstValueFrom(
      this.cars.pipe(first((car) => car.canHandleBooking(booking), false))
    )
  }

  async handleBooking(booking, car) {
    info(`🚗 Fleet ${this.name} handling booking ${booking.id}`)
    booking.fleet = this
    if (booking.carId) {
      car = await firstValueFrom(
        from(this.cars).pipe(find((car) => car.id === booking.carId))
      )
    }

    if (car) {
      debug(`📦 Dispatching ${booking.id} to ${this.name} (manual)`)
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
