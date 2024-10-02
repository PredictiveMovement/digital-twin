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

  //Samla ihop alla bokningar, innan mergemap, buffertime.
  //Samla ihop alla under 5 sekunder i en array.
  //Merga ihop med cars, funktionen heter zip? T.ex this.cars.pipe, to array, zip av den. Gör en dispatch och skicka till plan i Vroom.
  //Tar emot lista med bilar och bokningar.
  //Kommer en ny ström tillbaka med bokning och bil som par.
  //Sen tar man handleBooking på bilen.
  handleAllBookings() {
    return from(this.bookings).pipe(
      bufferTime(5000),
      tap((bookingBatch) =>
        info(`${bookingBatch.length} bokningar buffrade för ${this.name}`)
      ),
      withLatestFrom(this.cars.pipe(toArray())),
      mergeMap(([bookingBatch, cars]) => {
        const totalBookings = bookingBatch.length
        const totalCars = cars.length
        return from(Array(totalBookings).keys()).pipe(
          map((index) => ({
            booking: bookingBatch[index],
            car: cars[index % totalCars],
          })),
          mergeMap(({ booking, car }) =>
            this.handleBookingWithCar(booking, car)
          )
        )
      }),
      catchError((err) => {
        error(`Fel vid hantering av bokningar för ${this.name}:`, err)
        return of(null)
      }),
      shareReplay()
    )
  }

  handleBookingWithCar(booking, car) {
    if (car.canHandleBooking(booking)) {
      return from(car.handleBooking(booking))
    } else {
      this.unhandledBookings.next(booking)
      return of(booking)
    }
  }
}

module.exports = Fleet
