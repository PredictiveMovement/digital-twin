const {
  pipe,
  from,
  shareReplay,
  Subject,
  mergeMap,
  ReplaySubject,
  merge,
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
  takeUntil,
  take,
  scan,
  pluck,
} = require('rxjs/operators')
const Booking = require('./models/booking')
const { busDispatch } = require('./dispatch/busDispatch')
const { isInsideCoordinates } = require('../lib/polygon')
const { clusterPositions } = require('./kmeans')
const { haversine } = require('./distance')
const { taxiDispatch } = require('./dispatch/taxiDispatch')

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
    this.passengers = passengers.pipe(mergeAll())
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

    this.passengers
      .pipe(mergeMap((passenger) => passenger.bookings))
      .subscribe((booking) => {
        this.unhandledBookings.next(booking)
      })

    /*
    // TODO: add kmeans clustering to group bookings and cars by pickup
    // send those to vroom and get back a list of assignments
    // for each assignment, take the booking and dispatch it to the car / fleet */
    this.dispatchedBookings = new ReplaySubject()
    this.unhandledBookings
      .pipe(
        scan((acc, booking) => [...acc, booking], []),
        map((bookings) => bookings.filter((b) => !b.assigned)),
        filter((bookings) => bookings.length > 10),
        mergeMap((bookings) => clusterPositions(bookings)), // continously cluster bookings
        mergeAll(),
        map(({ center, items: bookings }) => ({ center, bookings })),
        filter(({ bookings }) => bookings.length > 5), // wait until we have at least 10 bookings in a cluster
        mergeMap(({ center, bookings }) =>
          this.taxis.pipe(
            map((taxi) => ({
              taxi,
              distance: haversine(taxi.position, center),
            })),
            filter(({ distance }) => distance < 100_000),
            pluck('taxi'),
            filter(
              ({ queue, cargo, capacity }) =>
                queue.length + cargo.length < capacity
            ), // TODO: filter out all cars that are fully booked
            takeNearest(center, 10),
            filter((taxis) => taxis.length),
            mergeMap((taxis) => taxiDispatch(taxis, bookings))
          )
        ),
        mergeAll()
      )
      .subscribe(({ taxi, bookings }) => {
        bookings.forEach((booking) => {
          console.log('Dispatching booking', booking.id, 'to taxi', taxi.id)
          taxi.handleBooking(booking)
          this.dispatchedBookings.next(booking)
        })
      })

    // Move this to passenger instead
    /*this.unhandledBookings.pipe(
      mergeMap((booking) => taxiDispatch(this.taxis, booking)),
      mergeAll()
    ).subscribe(() => {

    })*/

    /*    taxiDispatch(this.taxis, this.passengers).subscribe((e) => {
      e.map(({ taxi, steps }) => steps.map((step) => taxi.addInstruction(step)))
    }) */
  }
}

const takeNearest = (center, count) =>
  pipe(
    toArray(),
    map((taxis) =>
      taxis
        .sort((a, b) => {
          const aDistance = haversine(a.position, center)
          const bDistance = haversine(b.position, center)
          return aDistance - bDistance
        })
        .slice(0, count)
    )
  )

const stopsToBooking = ([pickup, destination]) =>
  new Booking({
    pickup,
    destination,
    lineNumber: pickup.lineNumber ?? destination.lineNumber,
  })

module.exports = Region
