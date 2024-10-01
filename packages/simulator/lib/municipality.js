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

    this.cars = this.getAllCars()
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
          id: `vehicle-${index}`,
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
        const clusters = this.clusterBookingsByArea(bookings)
        return this.uniqueVehicles.pipe(
          mergeMap((uniqueVehicles) => {
            info(`Totalt antal unika fordon: ${uniqueVehicles.length}`)
            const totalBookings = Object.values(clusters).reduce(
              (sum, clusterData) => sum + clusterData.bookings.length,
              0
            )
            info(`Totalt antal bokningar: ${totalBookings}`)

            const fleetDistribution = this.calculateFleetDistribution(
              clusters,
              uniqueVehicles
            )

            return from(Object.entries(fleetDistribution)).pipe(
              map(([groupName, { vehicles }], index) => {
                const groupData = clusters[groupName]
                const fleetName = `Fleet-${index}`
                const fleetVehicles = vehicles

                info(
                  `${fleetName}: ${groupData.postalCodes.length} områden - ${groupData.bookings.length} bokningar, tilldelat ${vehicles.length} fordon`
                )

                return new Fleet({
                  name: fleetName,
                  hub: this.center,
                  type: 'recycleTruck',
                  municipality: this,
                  postalCodes: groupData.postalCodes,
                  bookings: groupData.bookings,
                  vehicles: fleetVehicles,
                  recyclingTypes: Array.from(groupData.recyclingTypes),
                })
              }),
              tap((fleet) =>
                info(
                  `Fleet skapad: ${fleet.name} med ${fleet.vehicles.length} fordon och ${fleet.bookings.length} bokningar`
                )
              )
            )
          })
        )
      }),
      shareReplay()
    )
  }

  calculateFleetDistribution(clusters, uniqueVehicles) {
    const fleetDistribution = {}
    const totalClusters = Object.keys(clusters).length
    const vehiclesPerCluster = Math.ceil(uniqueVehicles.length / totalClusters)

    let vehicleIndex = 0

    Object.entries(clusters).forEach(([groupName, groupData]) => {
      const vehiclesForCluster = []
      for (
        let i = 0;
        i < vehiclesPerCluster && vehicleIndex < uniqueVehicles.length;
        i++
      ) {
        vehiclesForCluster.push(uniqueVehicles[vehicleIndex++])
      }
      fleetDistribution[groupName] = {
        vehicles: vehiclesForCluster,
      }
    })

    return fleetDistribution
  }

  clusterBookingsByArea(bookings) {
    return bookings.reduce((clusters, booking) => {
      const postalCode = booking.pickup.postalcode || 'unknown'
      const areaCode = postalCode.substring(0, 4)
      if (!clusters[areaCode]) {
        clusters[areaCode] = {
          postalCodes: [],
          bookings: [],
          recyclingTypes: new Set(),
        }
      }
      clusters[areaCode].postalCodes.push(postalCode)
      clusters[areaCode].bookings.push(booking)
      clusters[areaCode].recyclingTypes.add(booking.recyclingType)
      return clusters
    }, {})
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

  getAllCars() {
    return merge(
      this.privateCars,
      this.fleets.pipe(mergeMap((fleet) => fleet.cars))
    ).pipe(shareReplay())
  }
}

module.exports = Municipality
