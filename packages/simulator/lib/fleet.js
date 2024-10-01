// fleet.js

const { Subject, from, of } = require('rxjs')
const {
  shareReplay,
  mergeMap,
  tap,
  catchError,
  toArray,
} = require('rxjs/operators')
const RecycleTruck = require('./vehicles/recycleTruck')
const Position = require('./models/position')
const { error, info } = require('./log')
const vroom = require('./vroom')

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
            fleet: this,
            position: this.hub.position,
            recyclingTypes: vehicleData.recyclingTypes,
          })
        )
      }),
      tap((car) =>
        info(
          `🚛 Fleet ${this.name} skapade fordon ${car.id} med recycleTypes ${car.recyclingTypes}`
        )
      ),
      shareReplay()
    )

    info(
      `Fleet ${this.name} skapad med ${this.vehicles.length} fordon och ${this.bookings.length} bokningar. Antal postnummer: ${this.postalCodes.length}`
    )

    this.unhandledBookings = new Subject()
    this.planRoutesWithVroom()
    this.dispatchedBookings = this.handleAllBookings()
  }

  async planRoutesWithVroom() {
    const bookingsArray = this.bookings
    const shipments = bookingsArray.map((booking, i) =>
      vroom.bookingToShipment(booking, i)
    )
    const vehiclesArray = await this.cars.pipe(toArray()).toPromise()
    const totalVehicles = vehiclesArray.length
    const maxVehiclesPerBatch = 100
    const numVehicleBatches = Math.ceil(totalVehicles / maxVehiclesPerBatch)

    for (let batchIndex = 0; batchIndex < numVehicleBatches; batchIndex++) {
      const batchVehiclesArray = vehiclesArray.slice(
        batchIndex * maxVehiclesPerBatch,
        (batchIndex + 1) * maxVehiclesPerBatch
      )
      const vehicles = batchVehiclesArray.map((vehicle, i) =>
        vroom.truckToVehicle(vehicle, i)
      )

      try {
        const result = await vroom.plan({
          shipments,
          vehicles,
        })
        result.routes.forEach((route) => {
          const vehicle = batchVehiclesArray.find(
            (v) => v.id === vehicles[route.vehicle].id
          )
          if (vehicle) {
            vehicle.setRoute(route)
          }
        })
      } catch (err) {
        error(
          `Fel vid Vroom-planering för ${this.name} batch ${batchIndex}:`,
          err
        )
      }
    }
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
