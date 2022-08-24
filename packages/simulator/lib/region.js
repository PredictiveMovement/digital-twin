const {
  pipe,
  from,
  shareReplay,
  Subject,
  mergeMap,
  ReplaySubject,
} = require('rxjs')
const {
  map,
  last,
  first,
  groupBy,
  tap,
  filter,
  pairwise,
  mergeAll,
  share,
  toArray,
  bufferCount,
} = require('rxjs/operators')
const Booking = require('./models/booking')
const { busDispatch } = require('./busDispatch')
const { taxiDispatch } = require('./taxiDispatch')
const { isInsideCoordinates } = require('../lib/polygon')

const getTripsPerKommun = (kommuner) => (stopTimes) =>
  stopTimes.pipe(
    groupBy(({ tripId }) => tripId),
    mergeMap((s) => s.pipe(toArray())),
    mergeMap((stops) => {
      const firstStop = stops[0]
      const lastStop = stops[stops.length - 1]
      return kommuner.pipe(
        filter(({ geometry }) =>
          isInsideCoordinates(firstStop.position, geometry.coordinates)
        ),
        map(({ name }) => ({
          tripId: firstStop.tripId,
          stops,
          firstStop,
          lastStop,
          kommun: name,
        }))
      )
    }),
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
      mergeMap(({ buses, trips }) =>
        buses.pipe(
          toArray(),
          map((buses) => ({
            buses,
            trips,
          }))
        )
      ),
      mergeMap(({ buses, trips }) =>
        trips.pipe(
          toArray(),
          map((trips) => ({
            buses,
            trips,
          }))
        )
      ),
      filter(({ buses, trips }) => buses.length && trips.length),
      mergeMap(({ buses, trips }) => busDispatch(buses, trips), 3), // try to find optimal plan x kommun at a time
      mergeAll(),
      mergeMap(({ bus, trips }) =>
        from(trips).pipe(
          mergeMap((trip) => from(trip.stops)),
          pairwise(),
          map(stopsToBooking),
          map((booking) => ({ bus, booking }))
        )
      )
    )

    stopAssignments
      .pipe(mergeMap(({ bus, booking }) => bus.handleBooking(booking), 5))
      .subscribe(() => {})

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
