const { Subject, from, merge, of, firstValueFrom, EMPTY } = require('rxjs')
const {
  shareReplay,
  mergeMap,
  tap,
  filter,
  first,
  catchError,
  toArray,
} = require('rxjs/operators')
const RecycleTruck = require('./vehicles/recycleTruck')
const Position = require('./models/position')
const { error, info, warn } = require('./log')

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
    recyclingType,
  }) {
    this.name = name
    this.type = type
    this.hub = { position: new Position(hub) }
    this.municipality = municipality
    this.postalCodes = postalCodes
    this.bookings = bookings
    this.vehicles = vehicles
    this.recyclingType = recyclingType

    this.cars = from(this.vehicles).pipe(
      mergeMap((vehicle) => {
        const Vehicle = vehicleTypes[this.type].class
        return of(
          new Vehicle({
            ...vehicleTypes[this.type],
            id: vehicle[0], // Använd carId som id
            fleet: this,
            position: this.hub.position,
            recyclingType: this.recyclingType,
          })
        )
      }),
      tap((car) =>
        info(
          `🚛 Fleet ${this.name} skapade fordon ${car.id} med recycleType ${car.recyclingType}`
        )
      ),
      shareReplay()
    )

    info(
      `Fleet ${this.name} skapad med ${this.vehicles.length} fordon och ${this.bookings.length} bokningar. Antal postnummer: ${this.postalCodes.length}`
    )

    this.unhandledBookings = new Subject()
    this.dispatchedBookings = this.handleAllBookings()
  }

  handleAllBookings() {
    return from(this.bookings).pipe(
      mergeMap((booking) => this.handleBooking(booking)),
      catchError((err) => {
        error(`Fel vid hantering av bokningar för ${this.name}:`, err)
        return of(null)
      }),
      shareReplay()
    )
  }

  handleBooking(booking) {
    return this.cars.pipe(
      toArray(),
      mergeMap((cars) => {
        const availableCars = cars.filter((car) =>
          car.canHandleBooking(booking)
        )
        if (availableCars.length > 0) {
          const carWithLeastBookings = availableCars.reduce((min, car) =>
            car.queue.length + (car.booking ? 1 : 0) <
            min.queue.length + (min.booking ? 1 : 0)
              ? car
              : min
          )
          return from(carWithLeastBookings.handleBooking(booking))
        } else {
          this.unhandledBookings.next(booking)
          return of(booking)
        }
      }),
      catchError((err) => {
        error(
          `Fel vid tilldelning av bokning ${booking.id} i ${this.name}:`,
          err
        )
        this.unhandledBookings.next(booking)
        return of(booking)
      })
    )
  }
}

module.exports = Fleet
