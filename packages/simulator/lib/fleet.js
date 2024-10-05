// fleet.js

const { Subject, from, of } = require('rxjs')
const {
  shareReplay,
  mergeMap,
  catchError,
  toArray,
  bufferTime,
  withLatestFrom,
  tap,
  mergeAll,
  map,
} = require('rxjs/operators')
const RecycleTruck = require('./vehicles/recycleTruck')
const Position = require('./models/position')
const { error, info, debug } = require('./log')
const { plan, truckToVehicle, bookingToShipment } = require('./vroom')

const vehicleClasses = {
  recycleTruck: {
    weight: 10 * 1000,
    parcelCapacity: 300,
    class: RecycleTruck,
  },
  baklastare: {
    weight: 10 * 1000,
    parcelCapacity: 300,
    class: RecycleTruck,
  },
  fyrfack: {
    weight: 10 * 1000,
    parcelCapacity: 300,
    class: RecycleTruck,
  },
  matbil: {
    weight: 10 * 1000,
    parcelCapacity: 300,
    class: RecycleTruck,
  },
  skåpbil: {
    weight: 10 * 1000,
    parcelCapacity: 300,
    class: RecycleTruck,
  },
  ['2-fack']: {
    weight: 10 * 1000,
    parcelCapacity: 300,
    class: RecycleTruck,
  },
  latrin: {
    weight: 10 * 1000,
    parcelCapacity: 300,
    class: RecycleTruck,
  },
  lastväxlare: {
    weight: 10 * 1000,
    parcelCapacity: 300,
    class: RecycleTruck,
  },
  kranbil: {
    weight: 10 * 1000,
    parcelCapacity: 300,
    class: RecycleTruck,
  },
}

class Fleet {
  constructor({ name, hub, type, municipality, vehicleTypes, recyclingTypes }) {
    this.name = name
    this.type = type
    this.hub = { position: new Position(hub) }
    this.municipality = municipality
    this.recyclingTypes = recyclingTypes
    this.nrOfVehicles = 0

    this.cars = from(Object.entries(vehicleTypes)).pipe(
      map(([type, nrOfVehicles]) => {
        const Vehicle = vehicleClasses[type]?.class
        if (!Vehicle) {
          error(`No class found for vehicle type ${type}`)
          return []
        }
        this.nrOfVehicles += nrOfVehicles
        return Array.from({ length: nrOfVehicles }).map(
          (_, i) =>
            new Vehicle({
              ...vehicleTypes[type],
              id: this.name + '-' + i,
              fleet: this,
              position: this.hub.position,
              recyclingTypes: recyclingTypes,
            })
        )
      }),
      mergeAll(), // platta ut arrayen
      shareReplay()
    )

    this.unhandledBookings = new Subject()
    this.dispatchedBookings = this.handleAllBookings()
  }

  canHandleBooking(booking) {
    debug(
      `Checking if ${this.name} can handle booking ${booking.recyclingType}`
    )
    return this.recyclingTypes.includes(booking.recyclingType)
  }

  handleBooking(booking) {
    this.unhandledBookings.next(booking)
    return booking
  }

  handleAllBookings() {
    return this.unhandledBookings.pipe(
      bufferTime(5000),
      withLatestFrom(this.cars.pipe(toArray())),
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
        routes.forEach((route) => {
          const car = cars.find((car) => car.id === route.vehicle)
          if (car) {
            route.steps.forEach((step) => {
              const booking = bookingBatch.find(
                (booking) => booking.bookingId === step.id
              )
              if (booking) {
                car.handleBooking(booking)
              } else {
                error(`No booking found for step ${step.id}`)
              }
            })
          } else {
            error(`No car found for route ${route.vehicle}`)
          }
        })
        return bookingBatch
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
        .filter(({ type }) => ['pickup'].includes(type))
        .map(({ id, type, arrival, departure, location }) => ({
          id,
          type,
          arrival,
          departure,
          location,
        })),
    }))
  }
}

module.exports = Fleet
