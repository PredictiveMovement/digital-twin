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
} = require('rxjs')
const Fleet = require('./fleet')
const { error, info } = require('./log')
const telge = require('../streams/orders/telge')
const { dispatch } = require('./dispatch/dispatchCentral')

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
      toArray(),
      mergeMap((bookings) => {
        return this.uniqueVehicles.pipe(
          mergeMap((uniqueVehicles) => {
            info(`Totalt antal unika fordon: ${uniqueVehicles.length}`)
            info(`Totalt antal bokningar: ${bookings.length}`)

            const fleetDistribution = this.calculateFleetDistribution(
              [
                ['BPLASTFÖRP', 'BRÄNN'],
                ['METFÖRP', 'BLANDAVF'],
              ],
              uniqueVehicles,
              bookings
            )

            return from(Object.entries(fleetDistribution)).pipe(
              map(
                (
                  [groupName, { vehicles, recyclingTypes, filteredBookings }],
                  index
                ) => {
                  const fleetName = `Fleet-${index}`
                  const fleetVehicles = vehicles

                  return new Fleet({
                    name: fleetName,
                    hub: this.center,
                    type: 'recycleTruck',
                    municipality: this,
                    bookings: filteredBookings,
                    vehicles: fleetVehicles,
                    recyclingTypes: Array.from(recyclingTypes),
                  })
                }
              ),
              tap((fleet) =>
                info(
                  `✅ Fleet skapad: ${fleet.name} med ${fleet.vehicles.length} fordon och ${fleet.bookings.length} bokningar`
                )
              )
            )
          })
        )
      }),
      shareReplay()
    )
  }

  //Create a fleet distribution with vehicles and their recyclingTypes
  calculateFleetDistribution(recyclingTypeGroups, uniqueVehicles, bookings) {
    const fleetDistribution = {}
    const assignedBookings = new Set()
    const assignedVehicles = new Set()

    recyclingTypeGroups.forEach((recyclingTypeGroup, index) => {
      //Hämta bilar som kan hantera denna typ av avfall
      const clusterVehicles = uniqueVehicles.filter(
        (vehicle) =>
          recyclingTypeGroup.some((recyclingType) =>
            vehicle.recyclingTypes.includes(recyclingType)
          ) && !assignedVehicles.has(vehicle.id)
      )

      console.log(
        `Cluster ${index} (${recyclingTypeGroup}) vehicles: ${clusterVehicles.length}`
      )

      //Hämta bokningar som inte redan tilldelats en fleet
      const filteredBookings = bookings.filter(
        (booking) =>
          recyclingTypeGroup.includes(booking.recyclingType) &&
          !assignedBookings.has(booking.id)
      )

      // Markera bokningar som tilldelats
      filteredBookings.forEach((booking) => assignedBookings.add(booking.id))
      clusterVehicles.forEach((vehicle) => assignedVehicles.add(vehicle.id))
      fleetDistribution[`Cluster-${index}`] = {
        vehicles: clusterVehicles,
        recyclingTypes: recyclingTypeGroup,
        filteredBookings: filteredBookings,
      }

      console.log(
        `Cluster ${index} (${recyclingTypeGroup}) bookings: ${filteredBookings.length}`
      )
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
}

module.exports = Municipality
