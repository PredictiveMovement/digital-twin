// municipality.js

const {
  from,
  shareReplay,
  Subject,
  ReplaySubject,
  mergeMap,
  merge,
  filter,
  catchError,
  tap,
  of,
  toArray,
  map,
  groupBy,
  take,
  zip,
} = require('rxjs')
const Fleet = require('./fleet')
const { error, info } = require('./log')
const telge = require('../streams/orders/telge')
const { dispatch } = require('./dispatch/dispatchCentral')
const { divideIntoClusters } = require('./clustering')

class Municipality {
  constructor({
    geometry,
    name,
    id,
    packageVolumes,
    email,
    zip,
    center,
    telephone,
    postombud,
    population,
    recycleCollectionPoints,
    citizens,
    squares,
    fleets,
  }) {
    this.squares = squares
    this.geometry = geometry
    this.name = name
    this.id = id
    this.email = email
    this.zip = zip
    this.center = center
    this.telephone = telephone
    this.postombud = postombud
    this.recycleCollectionPoints = recycleCollectionPoints
    this.packageVolumes = packageVolumes
    this.busesPerCapita = 100 / 80_000
    this.population = population
    this.privateCars = new ReplaySubject()
    this.unhandledBookings = new Subject()

    this.co2 = 0
    this.citizens = citizens

    this.initializeFleets()
  }

  initializeFleets() {
    this.uniqueVehicles = this.getUniqueVehicles()

    this.fleets = this.createFleets()

    this.recycleTrucks = this.getRecycleTrucks()

    this.dispatchedBookings = this.dispatchBookings()

    this.cars = this.privateCars
  }

  getUniqueVehicles() {
    return telge.pipe(
      filter((booking) => booking.carId),
      groupBy((booking) => booking.carId.trim()),
      mergeMap((group$) =>
        group$.pipe(
          toArray(),
          map((bookings) => {
            const carId = bookings[0].carId.trim()
            const recyclingTypes = [
              ...new Set(bookings.map((b) => b.recyclingType)),
            ]
            return { carId, recyclingTypes }
          })
        )
      ),
      toArray(),
      map((vehicles) =>
        vehicles.map((vehicle, index) => ({
          id: index,
          carId: vehicle.carId,
          recyclingTypes: vehicle.recyclingTypes,
        }))
      ),
      shareReplay(1)
    )
  }

  createFleets() {
    return this.recycleCollectionPoints.pipe(
      divideIntoClusters,
      toArray(),
      mergeMap((clusteredBookings) => {
        return this.uniqueVehicles.pipe(
          mergeMap((uniqueVehicles) => {
            info(`Totalt antal unika fordon: ${uniqueVehicles.length}`)
            info(`Totalt antal kluster: ${clusteredBookings.length}`)

            const fleetDistribution = this.calculateFleetDistribution(
              clusteredBookings,
              uniqueVehicles
            )

            return from(Object.entries(fleetDistribution)).pipe(
              mergeMap(
                (
                  [clusterName, { vehicles, recyclingTypes, bookings }],
                  index
                ) => {
                  const fleetName = `Fleet-${index}-${clusterName}`
                  const fleet = new Fleet({
                    name: fleetName,
                    hub: this.center,
                    type: 'recycleTruck',
                    municipality: this,
                    bookings: from(bookings),
                    vehicles: vehicles,
                    recyclingTypes: Array.from(recyclingTypes),
                  })

                  // Vänta på att både fleet-skapandet och den initiala planeringen är klar
                  return zip(
                    of(fleet),
                    fleet.dispatchedBookings.pipe(take(1))
                  ).pipe(map(([fleet, _]) => fleet))
                }
              ),
              toArray(), // Samla alla fleets i en array
              mergeMap((fleets) => {
                // Start routing for all cars in all fleets
                return from(fleets).pipe(
                  mergeMap((fleet) => fleet.cars),
                  mergeMap((car) => car.startRouting()),
                  toArray(), // Wait for all cars to start routing
                  map(() => fleets) // Return the fleets array
                )
              })
            )
          })
        )
      }),
      shareReplay()
    )
  }

  calculateFleetDistribution(clusteredBookings, uniqueVehicles) {
    const fleetDistribution = {}
    const totalVehicles = uniqueVehicles.length

    clusteredBookings.forEach((cluster) => {
      const clusterName = cluster.postalCode
      const bookings = []
      const recyclingTypes = new Set()

      cluster.bookings.subscribe({
        next: (booking) => {
          bookings.push(booking)
          recyclingTypes.add(booking.recyclingType)
        },
        complete: () => {
          const suitableVehicles = uniqueVehicles.filter((vehicle) =>
            Array.from(recyclingTypes).some((type) =>
              vehicle.recyclingTypes.includes(type)
            )
          )

          const neededVehicles = Math.min(
            totalVehicles,
            Math.max(1, Math.ceil(bookings.length / 10))
          )

          fleetDistribution[clusterName] = {
            vehicles: suitableVehicles.slice(0, neededVehicles),
            recyclingTypes,
            bookings,
          }
        },
      })
    })

    return fleetDistribution
  }

  getRecycleTrucks() {
    return this.fleets.pipe(
      mergeMap((fleet) => fleet.cars),
      catchError((err) => {
        error('recycleTrucks -> fleet', err)
        return of(null)
      })
    )
  }

  dispatchBookings() {
    return this.fleets.pipe(
      toArray(),
      mergeMap((fleets) => dispatch(fleets, this.recycleCollectionPoints)),
      catchError((err) => {
        error('Fel i municipality dispatchedBookings:', err)
        return of(null)
      })
    )
  }

  redistributeUnassignedBookings(fleetDistribution, unassignedBookings) {
    unassignedBookings.forEach((booking) => {
      const suitableFleet = Object.values(fleetDistribution).find(
        (fleet) =>
          fleet.recyclingTypes.has(booking.recyclingType) &&
          fleet.bookings.length < fleet.vehicles.length * 10
      )

      if (suitableFleet) {
        suitableFleet.bookings.push(booking)
        info(
          `Omfördelad bokning till fleet med ${suitableFleet.bookings.length} bokningar`
        )
      } else {
        //error(`Kunde inte omfördela bokning: ${booking.id}`)
      }
    })
  }
}

module.exports = Municipality
