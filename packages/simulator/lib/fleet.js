const { Subject, range, from, merge, of, firstValueFrom } = require('rxjs')
const {
  shareReplay,
  mergeMap,
  share,
  catchError,
  first,
  tap,
} = require('rxjs/operators')
const { dispatch } = require('./dispatch/manual')
const RecycleTruck = require('./vehicles/recycleTruck')
const Taxi = require('./vehicles/taxi')
const Position = require('./models/position')
const { error, debug, info } = require('./log')
const { de } = require('date-fns/locale')

const truckStopsData = JSON.parse(fs.readFileSync('./truckStops.json', 'utf8'))

// A map to group stops by truck id ('Bil')
const stopsByTruck = truckStopsData.reduce((acc, stop) => {
  const truckId = stop.Bil
  if (!acc[truckId]) acc[truckId] = []
  acc[truckId].push(stop)
  return acc
}, {})

const vehicleTypes = {
  recycleTruck: {
    weight: 10 * 1000,
    parcelCapacity: 500,
    class: RecycleTruck,
  },
  taxi: {
    weight: 1000,
    parcelCapacity: 0,
    passengerCapacity: 4,
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
    console.log(`🚗 Fleet ${this.name} created. Vehicles: `, vehicles)
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
      tap((car) => info(`🚛 Fleet ${this.name} created vehicle ${car.id}`)),
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
    debug(`🚗 Fleet ${this.name} checking booking ${booking.id}`)
    return firstValueFrom(
      this.cars.pipe(
        first((car) => car.canHandleBooking(booking), false /* defaultValue */)
        // TODO: handle case when all cars are busy or full?
      )
    )
  }

  async handleBooking(booking, car) {
    booking.fleet = this
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
