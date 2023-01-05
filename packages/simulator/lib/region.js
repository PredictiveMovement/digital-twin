const {
  pipe,
  from,
  shareReplay,
  mergeMap,
  merge,
  Subject,
  of,
} = require('rxjs')
const {
  map,
  groupBy,
  tap,
  filter,
  pairwise,
  mergeAll,
  share,
  toArray,
  pluck,
  catchError,
  switchMap,
  bufferTime,
  retryWhen,
  delay,
  take,
  bufferCount,
  scan,
  throttle,
  debounceTime,
  concatMap,
} = require('rxjs/operators')
const Booking = require('./models/booking')
const { busDispatch } = require('./dispatch/busDispatch')
const { isInsideCoordinates } = require('../lib/polygon')
const { clusterPositions } = require('./kmeans')
const { haversine } = require('./distance')
const { taxiDispatch } = require('./dispatch/taxiDispatch')
const { error, info } = require('./log')
const Taxi = require('./vehicles/taxi')

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
    citizens,
    kommuner,
  }) {
    this.geometry = geometry
    this.name = name
    this.id = id
    this.stops = stops
    this.citizens = citizens
    this.lineShapes = lineShapes

    this.taxis = kommuner.pipe(
      mergeMap((kommun) => kommun.cars),
      filter((car) => car.vehicleType === 'taxi'),
      shareReplay()
    )

    this.buses = kommuner.pipe(
      map((kommun) => kommun.buses),
      mergeAll(),
      shareReplay()
    )

    this.stopAssignments = stopTimes.pipe(
      getTripsPerKommun(kommuner),
      map(({ kommunName, trips }) => ({
        buses: this.buses.pipe(filter((bus) => bus.kommun === kommunName)),
        trips,
      })),
      flattenProperty('buses'),
      flattenProperty('trips'),
      filter(({ buses, trips }) => buses.length && trips.length),
      mergeMap(({ buses, trips }) => busDispatch(buses, trips), 3), // try to find optimal plan x kommun at a time
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

    this.unhandledBookings = this.citizens.pipe(
      mergeMap((passenger) => passenger.bookings),
      filter((booking) => !booking.assigned),
      catchError((err) => error('unhandledBookings', err)),
      share()
    )

    this.manualBookings = new Subject()

    /*
    // TODO: Move this to dispatch central:
    // TODO: add kmeans clustering to group bookings and cars by pickup
    // send those to vroom and get back a list of assignments
    // for each assignment, take the booking and dispatch it to the car / fleet */
    this.dispatchedBookings = merge(
      this.stopAssignments.pipe(
        mergeMap(({ bus, booking }) => bus.handleBooking(booking), 5),
        filter((booking) => !booking.assigned),
        catchError((err) => error('region stopAssignments', err)),
        share()
      ),
      this.taxis.pipe(
        tap((taxi) => info('taxi found', taxi.id)),
        scan((acc, taxi) => acc.push(taxi) && acc, []),
        debounceTime(1000),
        tap((cars) => info('region taxis', cars.length)),
        filter((taxis) => taxis.length > 0),
        mergeMap((taxis) =>
          merge(this.manualBookings, this.unhandledBookings).pipe(
            bufferTime(5000),
            filter((bookings) => bookings.length > 0),
            tap((bookings) => info('Clustering bookings', bookings.length)),
            switchMap((bookings) =>
              clusterPositions(
                bookings,
                Math.max(5, Math.ceil(bookings.length / 10))
              )
            ),
            mergeAll(),
            map(({ center, items: bookings }) => ({ center, bookings })),
            tap(({ center, bookings }) =>
              info('cluster', center, bookings.length)
            ),
            catchError((err) => error('taxi cluster err', err)),
            concatMap(({ center, bookings }) => {
              const nearestTaxis = takeNearest(taxis, center, 10).filter(
                ({ passengerCapacity: c, passengers: p }) => c > p.length
              )
              return taxiDispatch(nearestTaxis, bookings).catch((err) => {
                error('taxiDispatch', err)
                bookings.forEach((booking) => this.manualBookings.next(booking))
                return of([])
              })
            }),
            filter((bookings) => bookings.length),
            mergeAll(),
            mergeMap(({ taxi, bookings }) =>
              from(bookings).pipe(
                mergeMap((booking) => taxi.fleet.handleBooking(booking, taxi))
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
        share()
      )
    )
    // Move this to passenger instead
    /*this.unhandledBookings.pipe(
      mergeMap((booking) => taxiDispatch(this.taxis, booking)),
      mergeAll()
    ).subscribe(() => {
      console.log("Thing")
    })*/

    /*    taxiDispatch(this.taxis, this.passengers).subscribe((e) => {
      e.map(({ taxi, steps }) => steps.map((step) => taxi.addInstruction(step)))
    }) */
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
