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

const tripsInMunicipality = (municipalities) => (stops) =>
  stops.pipe(
    groupBy(({ tripId }) => tripId),
    mergeMap((s) => s.pipe(toArray())),
    filter((stops) => stops.length > 1),
    mergeMap((stops) => {
      const firstStop = stops[0]
      const lastStop = stops[stops.length - 1]
      return municipalities.pipe(
        filter(({ geometry }) =>
          isInsideCoordinates(firstStop.position, geometry.coordinates)
        ),
        map(({ name }) => ({
          tripId: firstStop.tripId,
          lineNumber: stops[0].lineNumber,
          stops,
          firstStop,
          lastStop,
          municipality: name,
        }))
      )
    })
  )

class Region {
  constructor({ id, name, geometry, stops, municipalities }) {
    this.id = id

    this.geometry = geometry
    this.name = name
    this.trips = tripsInMunicipality(municipalities)(stops).pipe(shareReplay()) // trips = bussavgångar
    this.stops = this.trips.pipe(
      mergeMap(({ municipality, stops }) =>
        municipalities.pipe(
          first(({ name }) => name === municipality, null), // is this an included municipality?
          mergeMap((municipality) => (municipality ? stops : of(null)))
        )
      )
    )
    this.lineShapes = this.trips.pipe(
      map(
        ({ tripId, stops, lineNumber, firstStop, lastStop, municipality }) => ({
          tripId,
          lineNumber,
          from: firstStop.name,
          to: lastStop.name,
          municipality,
          stops: stops.map(({ stop }) => stop.position),
        })
      )
    )
    this.municipalities = municipalities // TODO: Rename to municipalities.

    /**
     * Static map objects.
     */

    this.postombud = municipalities.pipe(
      mergeMap((municipality) => municipality.postombud)
    )

    /**
     * Vehicle streams.
     */

    this.buses = municipalities.pipe(
      map((municipality) => municipality.buses),
      mergeAll(),
      shareReplay()
    )

    this.cars = municipalities.pipe(
      mergeMap((municipality) => municipality.cars)
    )

    this.taxis = municipalities.pipe(
      mergeMap((municipality) => municipality.cars),
      filter((car) => car.vehicleType === 'taxi'),
      catchError((err) => error('taxi err', err))
    )

    this.recycleTrucks = municipalities.pipe(
      mergeMap((municipality) => municipality.recycleTrucks),
      catchError((err) => error('recycle trucks err', err))
    )

    this.recycleCollectionPoints = municipalities.pipe(
      mergeMap((municipality) => municipality.recycleCollectionPoints),
      catchError((err) => error('recycleCollectionPoints err', err))
    )
    /**
     * Transportable objects streams.
     */

    this.citizens = municipalities.pipe(
      mergeMap((municipality) => municipality.citizens)
    )

    this.stopAssignments = this.trips.pipe(
      groupBy((trip) => trip.municipality),
      map((trips) => ({
        buses: this.buses.pipe(
          filter((bus) => bus.fleet.municipality.name === trips.key)
        ),
        trips,
      })),
      flattenProperty('buses'),
      flattenProperty('trips'),
      filter(({ buses, trips }) => buses.length && trips.length),
      mergeMap(({ buses, trips }) => busDispatch(buses, trips), 1), // try to find optimal plan x municipality at a time
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
      this.municipalities.pipe(
        mergeMap((municipality) => municipality.dispatchedBookings)
      ),
      this.municipalities.pipe(
        mergeMap((municipality) => municipality.fleets),
        mergeMap((fleet) => fleet.dispatchedBookings)
      )
    ).pipe(share())
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
