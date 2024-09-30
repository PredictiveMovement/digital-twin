const {
  from,
  shareReplay,
  Subject,
  ReplaySubject,
  mergeMap,
  merge,
  filter,
  catchError,
  first,
  tap,
  of,
  toArray,
  map,
  groupBy,
} = require('rxjs')
const Fleet = require('./fleet')
const { error, info, warn } = require('./log')
const { searchOne } = require('./pelias')
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

    console.log('Fleet:', fleets)

    this.clusterBookingsByPostalCode = (bookings) => {
      return bookings.reduce((clusters, booking) => {
        const postalCode = booking.pickup.postalcode || 'unknown'
        if (!clusters[postalCode]) {
          clusters[postalCode] = []
        }
        clusters[postalCode].push(booking)
        return clusters
      }, {})
    }

    // Hämta unika bilar från Telge-bokningar
    this.uniqueVehicles = telge.pipe(
      filter((booking) => booking.carId),
      groupBy((booking) => booking.carId),
      mergeMap((group) => group.pipe(first())),
      map((booking) => [booking.carId, booking])
    )

    // Skapa en fleet per postnummer
    this.fleets = this.recycleCollectionPoints.pipe(
      toArray(),
      mergeMap((bookings) => {
        const clusters = this.clusterBookingsByPostalCode(bookings)
        return this.uniqueVehicles.pipe(
          toArray(),
          mergeMap((uniqueVehicles) => {
            info(`Totalt antal unika fordon: ${uniqueVehicles.length}`)
            const totalBookings = Object.values(clusters).reduce(
              (sum, clusterBookings) => sum + clusterBookings.length,
              0
            )
            info(`Totalt antal bokningar: ${totalBookings}`)

            const groupedClusters = this.groupClustersByProximity(clusters)

            // Beräkna ideal fördelning av fordon
            let idealVehicleDistribution = Object.entries(groupedClusters).map(
              ([groupName, groupData]) => {
                return {
                  groupName,
                  bookings: groupData.bookings.length,
                  vehicles: 0,
                }
              }
            )

            // Säkerställ att varje fleet får minst ett fordon
            let remainingVehicles = uniqueVehicles.length
            idealVehicleDistribution.forEach((group) => {
              group.vehicles = 1
              remainingVehicles--
            })

            // Fördela resterande fordon baserat på bokningar
            while (remainingVehicles > 0) {
              const totalUnallocatedBookings = idealVehicleDistribution.reduce(
                (sum, group) => sum + group.bookings,
                0
              )
              const groupToAllocate = idealVehicleDistribution.reduce(
                (max, current) =>
                  current.bookings / current.vehicles >
                  max.bookings / max.vehicles
                    ? current
                    : max
              )
              groupToAllocate.vehicles++
              remainingVehicles--
            }

            return from(idealVehicleDistribution).pipe(
              map(({ groupName, vehicles }, index) => {
                const groupData = groupedClusters[groupName]
                const fleetName = `Fleet-${index}`
                const fleetVehicles = uniqueVehicles.splice(0, vehicles)

                info(
                  `${fleetName}: ${groupData.postalCodes.length} postnummer - ${groupData.bookings.length} bokningar, tilldelat ${vehicles} fordon`
                )

                return new Fleet({
                  name: fleetName,
                  hub: this.center,
                  type: 'recycleTruck',
                  municipality: this,
                  postalCodes: groupData.postalCodes,
                  bookings: groupData.bookings,
                  vehicles: fleetVehicles,
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

    this.recycleTrucks = this.fleets.pipe(
      mergeMap((fleet) => fleet.cars),
      catchError((err) => {
        error('recycleTrucks -> fleet', err)
        return of(null)
      })
    )

    this.dispatchedBookings = this.fleets.pipe(
      toArray(),
      mergeMap((fleets) => dispatch(fleets, this.recycleCollectionPoints)),
      catchError((err) => {
        error('Fel i municipality dispatchedBookings:', err)
        return of(null)
      })
    )

    this.cars = merge(
      this.privateCars,
      this.fleets.pipe(mergeMap((fleet) => fleet.cars))
    ).pipe(shareReplay())
  }

  groupClustersByProximity(clusters) {
    const groupedClusters = {}

    Object.entries(clusters).forEach(([postalCode, bookings]) => {
      const groupKey = postalCode.substring(0, 3)
      if (!groupedClusters[groupKey]) {
        groupedClusters[groupKey] = { postalCodes: [], bookings: [] }
      }
      groupedClusters[groupKey].postalCodes.push(postalCode)
      groupedClusters[groupKey].bookings =
        groupedClusters[groupKey].bookings.concat(bookings)
    })

    return groupedClusters
  }

  createBalancedFleets(sortedClusters, fleetCount) {
    const fleets = {}
    for (let i = 0; i < fleetCount; i++) {
      fleets[`Fleet-${i}`] = { postalCodes: [], bookings: [] }
    }

    sortedClusters.forEach(([postalCode, bookings], index) => {
      const fleetIndex = index % fleetCount
      const fleetName = `Fleet-${fleetIndex}`
      fleets[fleetName].postalCodes.push(postalCode)
      fleets[fleetName].bookings = fleets[fleetName].bookings.concat(bookings)
    })

    return fleets
  }

  groupClusters(sortedClusters, desiredFleetCount) {
    const groupedClusters = {}
    const clusterCount = sortedClusters.length
    const clustersPerFleet = Math.ceil(clusterCount / desiredFleetCount)

    sortedClusters.forEach(([postalCode, bookings], index) => {
      const fleetIndex = Math.floor(index / clustersPerFleet)
      const fleetName = `Fleet-${fleetIndex}`

      if (!groupedClusters[fleetName]) {
        groupedClusters[fleetName] = { postalCodes: [], bookings: [] }
      }

      groupedClusters[fleetName].postalCodes.push(postalCode)
      groupedClusters[fleetName].bookings =
        groupedClusters[fleetName].bookings.concat(bookings)
    })

    return groupedClusters
  }

  groupPostalCodesToFleets(postalCodes, desiredFleetCount) {
    const fleetPostalCodes = {}
    postalCodes.forEach((pc, index) => {
      const fleetName = `Fleet-${Math.floor(
        index / Math.ceil(postalCodes.length / desiredFleetCount)
      )}`
      if (!fleetPostalCodes[fleetName]) {
        fleetPostalCodes[fleetName] = []
      }
      fleetPostalCodes[fleetName].push(pc)
    })
    return fleetPostalCodes
  }
}

module.exports = Municipality
