const { pipe, from, shareReplay, Subject, mergeMap } = require('rxjs')
const {
  map,
  last,
  first,
  groupBy,
  tap,
  filter,
  pairwise,
  mergeAll,
} = require('rxjs/operators')
const Booking = require('./models/booking')
const { busDispatch } = require('./busDispatch')
const { taxiDispatch } = require('./taxiDispatch')
const { isInsideCoordinates } = require('../lib/polygon')

const getTripsPerKommun = (kommuner) => (stopTimes) =>
  stopTimes.pipe(
    groupBy(({ tripId }) => tripId),
    mergeMap((group) => {
      return group.pipe(
        shareReplay(),
        first(null, null), // get the first stop in the trip and return null if there are no stops in this kommun
        filter((d) => d), // filter out all empty trips directly
        mergeMap((firstStop) =>
          kommuner.pipe(
            filter(({ geometry }) =>
              isInsideCoordinates(firstStop.position, geometry.coordinates)
            ),
            map(({ name }) => ({
              tripId: firstStop?.tripId,
              stops: group,
              firstStop,
              kommun: name,
            })),
            mergeMap((trip) =>
              group.pipe(
                last(null, null),
                map((lastStop) => ({ ...trip, lastStop }))
              )
            )
          )
        )
      )
    }),
    filter(({ firstStop, lastStop }) => firstStop && lastStop), // remove all kommuns without stops
    groupBy(({ kommun }) => kommun),
    map((trips) => ({
      kommunName: trips.key,
      trips,
    }))
  )

class Region {
  constructor({
    geometry,
    name,
    id,
    stops,
    stopTimes,
    lineShapes,
    passengers,
    kommuner,
  }) {
    this.geometry = geometry
    this.name = name
    this.id = id
    this.unhandledBookings = new Subject()
    this.stops = stops
    this.passengers = passengers.pipe(shareReplay())
    this.lineShapes = lineShapes

    this.taxis = kommuner.pipe(
      map((kommun) => kommun.taxis),
      mergeAll(),
      shareReplay()
    )

    this.buses = kommuner.pipe(
      map((kommun) => kommun.buses),
      mergeAll(),
      shareReplay()
    )

    const stopAssignments = stopTimes.pipe(
      getTripsPerKommun(kommuner),
      map(({ kommunName, trips }) => ({
        buses: this.buses.pipe(filter((bus) => bus.kommun === kommunName)),
        trips,
      })),
      filter(({ buses, trips }) => buses.length && trips.length),
      mergeMap(({ buses, trips }) => busDispatch(buses, trips)),
      mergeMap(({ bus, trips }) =>
        from(trips).pipe(
          mergeMap((trip) => trip.stops),
          pairwise(),
          map(stopsToBooking),
          map((booking) => ({ bus, booking }))
        )
      ),
      mergeAll()
    )

    stopAssignments.subscribe(({ bus, booking }) => bus.handleBooking(booking))

    taxiDispatch(this.taxis, passengers).subscribe((e) => {
      e.map(({ taxi, steps }) => steps.map((step) => taxi.addInstruction(step)))
    })
  }
}
const stopsToBooking = ([pickup, destination]) =>
  new Booking({
    pickup,
    destination,
    lineNumber: pickup.lineNumber ?? destination.lineNumber,
  })

module.exports = Region
