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
      groupBy((booking) => booking.carId),
      mergeMap((group) => group.pipe(first())),
      map((booking) => [booking.carId, booking]),
      toArray(),
      shareReplay(1)
    )
  }

  createFleets() {
    return this.recycleCollectionPoints.pipe(
      toArray(),
      mergeMap((bookings) => {
        const clusters = this.clusterBookingsByPostalCode(bookings)
        return this.uniqueVehicles.pipe(
          mergeMap((uniqueVehicles) => {
            info(`Totalt antal unika fordon: ${uniqueVehicles.length}`)
            const totalBookings = Object.values(clusters).reduce(
              (sum, clusterBookings) => sum + clusterBookings.length,
              0
            )
            info(`Totalt antal bokningar: ${totalBookings}`)

            const groupedClusters = this.groupClustersByProximity(clusters)
            const fleetDistribution = this.calculateFleetDistribution(
              groupedClusters,
              uniqueVehicles.length
            )

            return from(Object.entries(fleetDistribution)).pipe(
              map(([groupName, { vehicles }], index) => {
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

  clusterBookingsByPostalCode(bookings) {
    return bookings.reduce((clusters, booking) => {
      const postalCode = booking.pickup.postalcode || 'unknown'
      if (!clusters[postalCode]) {
        clusters[postalCode] = []
      }
      clusters[postalCode].push(booking)
      return clusters
    }, {})
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

  calculateFleetDistribution(groupedClusters, totalVehicles) {
    const fleetDistribution = {}
    let remainingVehicles = totalVehicles

    // Först, ge varje grupp minst ett fordon
    Object.keys(groupedClusters).forEach((groupName) => {
      fleetDistribution[groupName] = { vehicles: 1 }
      remainingVehicles--
    })

    // Fördela resterande fordon baserat på antalet bokningar
    const totalBookings = Object.values(groupedClusters).reduce(
      (sum, group) => sum + group.bookings.length,
      0
    )

    while (remainingVehicles > 0) {
      const groupToAllocate = Object.entries(groupedClusters).reduce(
        (max, [groupName, groupData]) => {
          const currentVehicles = fleetDistribution[groupName].vehicles
          const bookingsPerVehicle = groupData.bookings.length / currentVehicles
          return bookingsPerVehicle > max.bookingsPerVehicle
            ? { groupName, bookingsPerVehicle }
            : max
        },
        { groupName: null, bookingsPerVehicle: -1 }
      )

      if (groupToAllocate.groupName) {
        fleetDistribution[groupToAllocate.groupName].vehicles++
        remainingVehicles--
      } else {
        break
      }
    }

    return fleetDistribution
  }
}

module.exports = Municipality
