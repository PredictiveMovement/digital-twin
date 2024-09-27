const { Subject, from, merge, of, firstValueFrom } = require('rxjs')
const { shareReplay, mergeMap, share, tap, filter, first } = require('rxjs/operators')
const { dispatch } = require('./dispatch/dispatchCentral')
const RecycleTruck = require('./vehicles/recycleTruck')
const Position = require('./models/position')
const { error, info, debug } = require('./log')

const vehicleData = require('../data/telge/ruttdata_2024-09-03.json')

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
    console.log(`🚢 Fleet ${this.name} created. Vehicles loaded from file}`)

    const getOrdersFromCar = () => {
      return vehicleData.reduce((vehicles, route) => {
        const vehicleId = route.Bil.trim() // Bil is vehicle id

        // If the vehicle does not exist, create it
        if (!vehicles[vehicleId]) {
          vehicles[vehicleId] = {
            id: vehicleId,
            avftyp: route.Avftyp,
          }
        }

        return vehicles
      }, {})
    }

    const vehicles = getOrdersFromCar()

    // Create vehicles based on the JSON data
    this.cars = from(Object.entries(vehicles)).pipe(
      mergeMap(([id, vehicleData]) => {
        const Vehicle = vehicleTypes['recycleTruck'].class

        if (!Vehicle) {
          error(`Unknown vehicle class for vehicle ID ${id}`)
          return of(null)
        }

        return of(
          new Vehicle({
            ...vehicleTypes['recycleTruck'],
            id: `recycleTruck-${id}`, // Use Bil as the unique vehicle ID
            fleet: this,
            position: this.hub.position,
            plan: vehicleData.routes,
            carId: id,
            recyclingType: vehicleData.avftyp,
          })
        )
      }),
      filter((car) => car !== null),
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
    debug(`🚗 Fleet ${this.name} checking booking ${booking.id}`)
    return firstValueFrom(
      this.cars.pipe(
        first((car) => car.canHandleBooking(booking), false)
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
