const { Subject, filter, from, merge, of, firstValueFrom } = require('rxjs')
const { shareReplay, mergeMap, share, tap, first } = require('rxjs/operators')
const { dispatch } = require('./dispatch/dispatchCentral')
const RecycleTruck = require('./vehicles/recycleTruck')
const Taxi = require('./vehicles/taxi')
const Position = require('./models/position')
const { error, debug, info } = require('./log')

const vehicleData = require('../data/telge/ruttdata_2024-09-03.json')

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
    console.log(`🚢 Fleet ${this.name} created. Vehicles loaded from file}`)

    const getOrdersFromCar = () => {
      return vehicleData.reduce((vehicles, route) => {
        const vehicle = route.Bil.trim();
        if (!vehicles[vehicle]) {
          vehicles[vehicle] = [];
        }
        vehicles[vehicle].push(route);
        return vehicles;
      }, {});
    };

    const vehicles = getOrdersFromCar();

    // Create vehicles based on the JSON data
    this.cars = from(Object.entries(vehicles)).pipe(
      mergeMap(([id, orders]) => {
        const Vehicle = vehicleTypes['recycleTruck'].class

        if (!Vehicle) {
          error(`Unknown vehicle class for vehicle ID ${id}`)
          return of(null) // Skip this vehicle if the type is unknown
        }

        return of(
          new Vehicle({
            ...vehicleTypes['recycleTruck'],
            id: `recycleTruck-${id}`, // Use Bil as the unique vehicle ID
            fleet: this,
            position: this.hub.position,
            orders: orders,
          })
        )
      }),
      filter((car) => car !== null),
      //tap((car) => info(`🚛 Fleet ${this.name} created vehicle ${car.id}`)),
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
