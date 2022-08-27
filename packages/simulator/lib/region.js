const {
  pipe,
  from,
  shareReplay,
  Subject,
  mergeMap,
  ReplaySubject,
  lastValueFrom,
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
    this.passengers = passengers
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

    const flattenProperty = (property) => (stream) =>
      stream.pipe(
        mergeMap((object) =>
          object[property].pipe(
            toArray(),
            map((arr) => ({
              ...object,
              [property]: arr,
            }))
          )
        )
      )

    const stopAssignments = stopTimes.pipe(
      getTripsPerKommun(kommuner),
      map(({ kommunName, trips }) => ({
        buses: this.buses.pipe(filter((bus) => bus.kommun === kommunName)),
        trips,
      })),
      flattenProperty('buses'),
      flattenProperty('trips'),
      filter(({ buses, trips }) => buses.length && trips.length),
      mergeMap(({ buses, trips }) => busDispatch(buses, trips), 3), // try to find optimal plan x kommun at a time
      mergeAll(),
      mergeMap(({ bus, stops }) =>
        from(stops).pipe(
          pairwise(),
          map(stopsToBooking),
          map((booking) => ({ bus, booking }))
        )
      )
    )
  }

  distributeInstructions() {
    this.buses
      .pipe(
        toArray(),
        map((buses) =>
          buses.map((bus) => {
            bus.reset()
          })
        )
      )
      .subscribe(() =>
        this.stopAssignments
          .pipe(mergeMap(({ bus, booking }) => bus.handleBooking(booking), 5))
          .subscribe(() => {})
      )

    Promise.all(
      [
        lastValueFrom(
          this.taxis.pipe(
            toArray(),
            map((taxis) =>
              taxis.map((taxi) => {
                taxi.reset()
              })
            )
          )
        ),
      ],
      [
        lastValueFrom(
          this.passengers.pipe(
            toArray(),
            map((passengers) =>
              passengers.map((passenger) => {
                passenger.reset()
              })
            )
          )
        ),
      ]
    ).then(
      taxiDispatch(this.taxis, this.passengers).subscribe((e) => {
        e.map(({ taxi, steps }) =>
          steps.map((step) => taxi.addInstruction(step))
        )
      })
    )
  }
}
const stopsToBooking = ([pickup, destination]) =>
  new Booking({
    pickup,
    destination,
    lineNumber: pickup.lineNumber ?? destination.lineNumber,
  })

module.exports = Region
