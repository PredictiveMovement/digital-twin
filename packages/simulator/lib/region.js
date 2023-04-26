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

    this.measureStations = kommuner.pipe(
      mergeMap((kommun) => kommun.measureStations)
    )

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
      filter((car) => car.vehicleType === 'taxi')
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

    /*
     * TODO: Move this to dispatch central:
     * TODO: add kmeans clustering to group bookings and cars by pickup
     * send those to vroom and get back a list of assignments
     * for each assignment, take the booking and dispatch it to the car / fleet
     */
    this.dispatchedBookings = merge(
      this.stopAssignments.pipe(
        mergeMap(({ bus, booking }) => bus.handleBooking(booking), 5),
        filter((booking) => !booking.assigned),
        catchError((err) => error('region stopAssignments', err)),
        share()
      ),
      this.taxis.pipe(
        scan((acc, taxi) => acc.push(taxi) && acc, []),
        debounceTime(1000),
        filter((taxis) => taxis.length > 0),
        mergeMap((taxis) =>
          merge(this.manualBookings, this.unhandledBookings).pipe(
            bufferTime(5000, null, 100),
            filter((bookings) => bookings.length > 0),
            tap((bookings) =>
              info('Clustering taxi bookings', bookings.length, taxis.length)
            ),
            switchMap((bookings) => {
              const clusters = Math.max(5, Math.ceil(bookings.length / 10))
              if (bookings.length < taxis.length || bookings.length < clusters)
                return of([{ center: bookings[0].position, items: bookings }])

              return clusterPositions(bookings, Math.max(5, clusters))
            }),
            mergeAll(),
            map(({ center, items: bookings }) => ({ center, bookings })),
            catchError((err) => error('taxi cluster err', err)),
            concatMap(({ center, bookings }) => {
              const nearestTaxis = takeNearest(taxis, center, 10).filter(
                (taxi) => taxi.canPickupMorePassengers()
              )
              return taxiDispatch(nearestTaxis, bookings).catch((err) => {
                if (!bookings || !bookings.length) {
                  warn('Region -> Dispatched Bookings -> No bookings!', err)
                  return of([])
                }
                error('Region -> Dispatched Bookings -> Taxi', err)
                bookings.forEach((booking) => this.manualBookings.next(booking))
                return of([])
              })
            }),
            filter((bookings) => bookings.length),
            mergeAll(),
            mergeMap(({ taxi, bookings }) =>
              from(bookings).pipe(
                // TODO: We have a bug here, the system tries to dispatch taxis that are already full.
                mergeMap((booking) => taxi.fleet.handleBooking(booking, taxi)),
                catchError((err) =>
                  error('Region -> Dispatched Bookings -> Taxis', err)
                )
              )
            ),
            retryWhen((errors) =>
              errors.pipe(
                tap((err) =>
                  error('region taxi error, retrying in 1s...', err)
                ),
                delay(1000)
              )
            )
          )
        ),
        catchError((err) => error('region taxiDispatch', err)),
        share()
      )
    )
  }
}

const takeNearest = (taxis, center, count) =>
  taxis
    .sort((a, b) => {
      const aDistance = haversine(a.position, center)
      const bDistance = haversine(b.position, center)
      return aDistance - bDistance
    })
    .slice(0, count)

const stopsToBooking = ([pickup, destination]) =>
  new Booking({
    pickup,
    destination,
    lineNumber: pickup.lineNumber ?? destination.lineNumber,
    type: 'busstop',
  })

module.exports = Region
