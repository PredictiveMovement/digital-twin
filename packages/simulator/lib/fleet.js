// fleet.js

const { Subject, from, of } = require('rxjs')
const {
  shareReplay,
  mergeMap,
  tap,
  catchError,
  toArray,
  bufferTime,
  zip,
  repeat,
  withLatestFrom,
  map,
  take,
  filter,
} = require('rxjs/operators')
const RecycleTruck = require('./vehicles/recycleTruck')
const Position = require('./models/position')
const { error, info } = require('./log')
const { plan, truckToVehicle, bookingToShipment } = require('./vroom')

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
    hub,
    type,
    municipality,
    postalCodes,
    bookings,
    vehicles,
    recyclingTypes,
  }) {
    this.name = name
    this.type = type
    this.hub = { position: new Position(hub) }
    this.municipality = municipality
    this.postalCodes = postalCodes
    this.bookings = bookings
    this.vehicles = vehicles
    this.recyclingTypes = recyclingTypes

    this.cars = from(this.vehicles).pipe(
      mergeMap((vehicleData) => {
        const Vehicle = vehicleTypes[this.type].class
        return of(
          new Vehicle({
            ...vehicleTypes[this.type],
            id: vehicleData.id,
            carId: vehicleData.carId,
            fleet: this,
            position: this.hub.position,
            recyclingTypes: vehicleData.recyclingTypes,
          })
        )
      }),
      tap((car) =>
        info(
          `🚛 Fleet ${this.name} skapade fordon ${car.carId} med recycleTypes ${car.recyclingTypes}`
        )
      ),
      shareReplay()
    )

    this.unhandledBookings = new Subject()
    this.dispatchedBookings = this.handleAllBookings()
  }

  handleAllBookings() {
    return from(this.bookings).pipe(
      bufferTime(5000),
      tap((bookingBatch) =>
        info(`${bookingBatch.length} bokningar buffrade för ${this.name}`)
      ),
      withLatestFrom(this.cars.pipe(toArray())),
      tap(([bookingBatch, cars]) => {
        info(`Planerar ${bookingBatch.length} bokningar för ${this.name}`)
      }),
      mergeMap(async ([bookingBatch, cars]) => {
        const vehicles = cars.map((car, i) => truckToVehicle(car, car.id))
        const shipments = bookingBatch.map((booking, i) =>
          bookingToShipment(booking, i)
        )
        const vroomResponse = await plan({ shipments, vehicles })
        return { vroomResponse, cars, bookingBatch }
      }),
      mergeMap(({ vroomResponse, cars, bookingBatch }) => {
        const routes = this.getRoutes(vroomResponse)
        return from(routes).pipe(
          mergeMap((route) => {
            const car = cars.find((car) => car.id === route.vehicle)
            if (!car) {
              error(`No car found for route ${route.vehicle}`)
              return of(null)
            }
            return from(bookingBatch).pipe(
              mergeMap((booking) =>
                this.handleBookingWithCar(booking, car, route)
              )
            )
          })
        )
      }),
      catchError((err) => {
        error(`Fel vid hantering av bokningar för ${this.name}:`, err)
        return of(null)
      }),
      shareReplay()
    )
  }

  getRoutes(vroomResponse) {
    return vroomResponse.routes.map((route) => ({
      vehicle: route.vehicle,
      steps: route.steps
        .filter(({ type }) => ['pickup', 'delivery', 'start'].includes(type))
        .map(({ id, type, arrival, departure, location }) => ({
          id,
          type,
          arrival,
          departure,
          location,
        })),
    }))
  }

  handleBookingWithCar(booking, car, route) {
    if (car.canHandleBooking(booking)) {
      return from(car.handleBooking(booking)).pipe(
        tap(() => car.setRoute(route))
      )
    } else {
      this.unhandledBookings.next(booking)
      return of(booking)
    }
  }
}

module.exports = Fleet
