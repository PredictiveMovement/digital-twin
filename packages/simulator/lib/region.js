const { from, mergeMap, merge, Subject, of } = require('rxjs')
const {
  map,
  groupBy,
  tap,
  filter,
  pairwise,
  mergeAll,
  share,
  toArray,
  catchError,
  switchMap,
  bufferTime,
  retryWhen,
  delay,
  take,
  scan,
  debounceTime,
  concatMap,
  shareReplay,
  first,
} = require('rxjs/operators')
const { busDispatch } = require('./dispatch/busDispatch')
const { isInsideCoordinates } = require('../lib/polygon')
const { clusterPositions } = require('./kmeans')
const { haversine } = require('./distance')
const { taxiDispatch } = require('./dispatch/taxiDispatch')
const { error, info } = require('./log')
const Booking = require('./models/booking')

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

const tripsInKommun = (kommuner) => (stops) =>
  stops.pipe(
    groupBy(({ tripId }) => tripId),
    mergeMap((s) => s.pipe(toArray())),
    filter((stops) => stops.length > 1),
    mergeMap((stops) => {
      const firstStop = stops[0]
      const lastStop = stops[stops.length - 1]
      return kommuner.pipe(
        filter(({ geometry }) =>
          isInsideCoordinates(firstStop.position, geometry.coordinates)
        ),
        map(({ name }) => ({
          tripId: firstStop.tripId,
          lineNumber: stops[0].lineNumber,
          stops,
          firstStop,
          lastStop,
          kommun: name,
        }))
      )
    })
  )

class Region {
  constructor({ id, name, geometry, stops, kommuner }) {
    this.id = id

    this.geometry = geometry
    this.name = name
    this.trips = tripsInKommun(kommuner)(stops).pipe(shareReplay()) // trips = bussavgångar
    this.stops = this.trips.pipe(
      mergeMap(({ kommun, stops }) =>
        kommuner.pipe(
          first(({ name }) => name === kommun, null), // is this an included kommun?
          mergeMap((kommun) => (kommun ? stops : of(null)))
        )
      )
    )
    this.lineShapes = this.trips.pipe(
      map(({ tripId, stops, lineNumber, firstStop, lastStop, kommun }) => ({
        tripId,
        lineNumber,
        from: firstStop.name,
        to: lastStop.name,
        kommun,
        stops: stops.map(({ stop }) => stop.position),
      }))
    )
    this.kommuner = kommuner // TODO: Rename to municipalities.

    /**
     * Static map objects.
     */

    this.postombud = kommuner.pipe(mergeMap((kommun) => kommun.postombud))

    /**
     * Vehicle streams.
     */

    this.buses = kommuner.pipe(
      map((kommun) => kommun.buses),
      mergeAll(),
      shareReplay()
    )

    this.cars = kommuner.pipe(mergeMap((kommun) => kommun.cars))

    this.taxis = kommuner.pipe(
      mergeMap((kommun) => kommun.cars),
      filter((car) => car.vehicleType === 'taxi'),
      catchError((err) => error('taxi err', err))
    )

    this.recycleTrucks = kommuner.pipe(
      mergeMap((kommun) => kommun.recycleTrucks),
      catchError((err) => error('recycle trucks err', err))
    )

    this.recycleCollectionPoints = kommuner.pipe(
      mergeMap((kommun) => kommun.recycleCollectionPoints),
      catchError((err) => error('recycleCollectionPoints err', err))
    )
    /**
     * Transportable objects streams.
     */

    this.citizens = kommuner.pipe(mergeMap((kommun) => kommun.citizens))

    this.stopAssignments = this.trips.pipe(
      groupBy((trip) => trip.kommun),
      map((trips) => ({
        buses: this.buses.pipe(
          filter((bus) => bus.fleet.kommun.name === trips.key)
        ),
        trips,
      })),
      flattenProperty('buses'),
      flattenProperty('trips'),
      filter(({ buses, trips }) => buses.length && trips.length),
      mergeMap(({ buses, trips }) => busDispatch(buses, trips), 1), // try to find optimal plan x kommun at a time
      catchError((err) => error('stopAssignments', err)),
      retryWhen((errors) => errors.pipe(delay(1000), take(10))),
      mergeAll(),
      mergeMap(({ bus, stops }) =>
        from(stops).pipe(
          pairwise(),
          map(stopsToBooking),
          map((booking) => ({ bus, booking }))
        )
      ),
      catchError((err) => error('stopAssignments', err)),
      share()
    )

    this.manualBookings = new Subject()

    this.unhandledBookings = this.citizens.pipe(
      mergeMap((passenger) => passenger.bookings),
      filter((booking) => !booking.assigned),
      catchError((err) => error('unhandledBookings', err)),
      share()
    )

    this.dispatchedBookings = merge(
      this.kommuner.pipe(mergeMap((kommun) => kommun.dispatchedBookings)),
      this.kommuner.pipe(
        mergeMap((kommun) => kommun.fleets),
        mergeMap((fleet) => fleet.dispatchedBookings)
      )
    )
  }
}

const stopsToBooking = ([pickup, destination]) =>
  new Booking({
    pickup,
    destination,
    lineNumber: pickup.lineNumber ?? destination.lineNumber,
    type: 'busstop',
  })

module.exports = Region
