// fleet.js

const { Subject, from, of, ReplaySubject } = require('rxjs')
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
  filter,
  groupBy,
} = require('rxjs/operators')
const RecycleTruck = require('./vehicles/recycleTruck')
const Position = require('./models/position')
const { error, info, debug } = require('./log')
const { plan, truckToVehicle, bookingToShipment } = require('./vroom')
const {
  clusterByPostalCode,
  convertToVroomCompatibleFormat,
  planWithVroom,
  convertBackToBookings,
} = require('./clustering')

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
    this.vehiclesCount = 0

    this.cars = this.createCars(vehicleTypes)
    this.unhandledBookings = new ReplaySubject()
    this.dispatchedBookings = this.startDispatcher()
  }

  createCars(vehicleTypes) {
    return from(Object.entries(vehicleTypes)).pipe(
      map(([type, vehiclesCount]) => {
        const Vehicle = vehicleClasses[type]?.class
        if (!Vehicle) {
          error(`No class found for vehicle type ${type}`)
          return []
        }
        this.vehiclesCount += vehiclesCount
        return Array.from({ length: vehiclesCount }).map(
          (_, i) =>
            new Vehicle({
              ...vehicleTypes[type],
              id: this.name + '-' + i,
              fleet: this,
              position: this.hub.position,
              recyclingTypes: this.recyclingTypes,
            })
        )
      }),
      mergeAll(), // platta ut arrayen
      shareReplay()
    )
  }

  canHandleBooking(booking) {
    debug(
      `Checking if ${this.name} can handle booking ${booking.recyclingType}`
    )
    return this.recyclingTypes.includes(booking.recyclingType)
  }

  handleBooking(booking) {
    debug(`Fleet ${this.name} received booking ${booking.bookingId}`)
    this.unhandledBookings.next(booking) // add to queue
    return booking
  }

  // Handle all unhandled bookings via Vroom
  startDispatcher() {
    this.dispatchedBookings = this.unhandledBookings.pipe(
      bufferTime(1000),
      filter((bookings) => bookings.length > 0),
      clusterByPostalCode(200),
      withLatestFrom(this.cars.pipe(toArray())),
      convertToVroomCompatibleFormat(this.name),
      planWithVroom(),
      convertBackToBookings(),
      mergeMap(({ car, booking }) => {
        return car.handleBooking(booking)
      }),
      catchError((err) => {
        error(`Fel vid hantering av bokningar för ${this.name}:`, err)
        return of(null)
      })
    )
    return this.dispatchedBookings
  }
}

module.exports = Fleet
