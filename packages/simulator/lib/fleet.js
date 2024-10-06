// fleet.js

const { from, of, ReplaySubject, merge, firstValueFrom } = require('rxjs')
const {
  shareReplay,
  mergeMap,
  catchError,
  toArray,
  bufferTime,
  withLatestFrom,
  mergeAll,
  map,
  filter,
  tap,
  groupBy,
  find,
  share,
} = require('rxjs/operators')
const RecycleTruck = require('./vehicles/recycleTruck')
const Truck = require('./vehicles/truck')
const Position = require('./models/position')
const { error, debug, info } = require('./log')
const {
  clusterByPostalCode,
  convertToVroomCompatibleFormat,
  planWithVroom,
  convertBackToBookings,
} = require('./clustering')

const vehicleClasses = {
  recycleTruck: {
    weight: 10 * 1000,
    parcelCapacity: 200,
    class: Truck,
  },
  baklastare: {
    weight: 10 * 1000,
    parcelCapacity: 200,
    class: Truck,
  },
  fyrfack: {
    weight: 10 * 1000,
    parcelCapacity: 200,
    class: Truck,
  },
  matbil: {
    weight: 10 * 1000,
    parcelCapacity: 200,
    class: Truck,
  },
  skåpbil: {
    weight: 10 * 1000,
    parcelCapacity: 200,
    class: Truck,
  },
  ['2-fack']: {
    weight: 10 * 1000,
    parcelCapacity: 200,
    class: Truck,
  },
  latrin: {
    weight: 10 * 1000,
    parcelCapacity: 200,
    class: Truck,
  },
  lastväxlare: {
    weight: 10 * 1000,
    parcelCapacity: 200,
    class: Truck,
  },
  kranbil: {
    weight: 10 * 1000,
    parcelCapacity: 200,
    class: Truck,
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

    this.cars = this.createCars(vehicleTypes)
    this.unhandledBookings = new ReplaySubject()
    //this.dispatchedBookings = this.dispatchBookings()
  }

  createCars(vehicleTypes) {
    return from(Object.entries(vehicleTypes)).pipe(
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
    booking.fleet = this
    this.unhandledBookings.next(booking) // add to queue
    return booking
  }

  // Handle all unhandled bookings via Vroom
  startDispatcher() {
    if (this.dispatchedBookings) throw new Error('Dispatcher already started')
    this.dispatchedBookings = this.unhandledBookings.pipe(
      bufferTime(1000),
      filter((bookings) => bookings.length > 0),
      clusterByPostalCode(200, 5), // cluster bookings if we have more than what Vroom can handle for this fleet
      withLatestFrom(this.cars.pipe(toArray())),
      tap(([bookings, cars]) => {
        info(
          `Fleet ${this.name} received ${bookings.length} bookings and ${cars.length} cars`
        )
      }),
      convertToVroomCompatibleFormat(),
      planWithVroom(),
      convertBackToBookings(),
      filter(({ booking }) => !booking.assigned),
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
