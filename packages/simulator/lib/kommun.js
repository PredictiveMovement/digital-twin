const EventEmitter = require('events')
const {
  from,
  shareReplay,
  share,
  Subject,
  ReplaySubject,
  mergeMap,
  merge,
  of,
  range,
  Observable,
} = require('rxjs')
const {
  map,
  tap,
  filter,
  catchError,
  toArray,
  first,
  reduce,
  mapTo,
  groupBy,
  pluck,
  startWith,
} = require('rxjs/operators')
const Fleet = require('./fleet')
const Car = require('./vehicles/car')
const Bus = require('./vehicles/bus')
const { isInsideCoordinates } = require('./polygon')
const { stops, stopTimes } = require('../streams/publicTransport')
const { virtualTime } = require('../lib/virtualTime')
const moment = require('moment')

// expand fleets so that a fleet with marketshare 12% has 12 cars to choose from
const expandFleets = () => (fleets) =>
  fleets.pipe(
    mergeMap((fleet) => range(0, fleet.marketshare * 10).pipe(mapTo(fleet)))
  )

// pick a random item in an array-like stream
const pickRandom = () => (stream) =>
  stream.pipe(
    toArray(),
    map((arr) => arr[Math.floor(arr.length * Math.random())])
  )

class Kommun extends EventEmitter {
  constructor({
    geometry,
    name,
    id,
    packageVolumes,
    email,
    zip,
    telephone,
    postombud,
    squares,
    fleets,
  }) {
    super()
    this.squares = squares
    this.geometry = geometry
    this.name = name
    this.id = id
    this.email = email
    this.zip = zip
    this.telephone = telephone
    this.postombud = postombud
    this.packageVolumes = packageVolumes
    this.unhandledBookings = new Subject()
    this.population = this.squares.pipe(reduce((a, b) => a + b.population, 0))
    this.privateCars = new ReplaySubject()

    this.fleets = from(fleets.map((fleet) => new Fleet(fleet)))
    // this.buses = stopTimes.pipe(
    //   // tap(({ date }) => console.log('stop time', date)),
    //   groupBy(({ trip }) => trip.id), // en grupp per buss/tripId
    //   tap((trip) => console.log('trip.id', trip.id)),
    //   mergeMap((stopTimesPerTrip) => {
    //     return stopTimesPerTrip.pipe(
    //       first(), // ta ut den första avgångstiden för bussen
    //       filter(({ position }) =>
    //         isInsideCoordinates(position, this.geometry.coordinates)
    //       ),
    //       tap(console.log),
    //       map(({ date, trip, position }) => {
    //         console.log('ny buss', trip.id)
    //         return new Bus({
    //           id: trip.id,
    //           position,
    //           stops: stopTimesPerTrip,
    //         })
    //       })
    //     )
    //   }),
    //   shareReplay()
    // )

    const tripsInMunicipality = stopTimes.pipe(
      filter(({ position }) =>
        isInsideCoordinates(position, this.geometry.coordinates)
      ),
      groupBy(({ trip }) => trip.id),
    )

    this.buses = tripsInMunicipality.pipe(shareReplay(1)).pipe(
      mergeMap(stopTimesPerTrip =>
        stopTimesPerTrip.pipe(
          first(),
          map((firstStopTime) => {
            return new Bus({
              id: firstStopTime.trip.id,
              position: firstStopTime.position,
              stops: stopTimesPerTrip.pipe(startWith(firstStopTime)), // TODO: why do we need startsWith here?
            })
          })
        )
      ),
      shareReplay(),
    )

    this.cars = merge(
      this.privateCars,
      this.buses,
      this.fleets.pipe(mergeMap((fleet) => fleet.cars))
    ).pipe(shareReplay())

    this.dispatchedBookings = this.fleets.pipe(
      mergeMap((fleet) => fleet.dispatchedBookings),
      //      tap(booking => console.log('dispatched', booking)),
      catchError((error) => {
        console.log(error)
        return of(false)
      }),
      shareReplay()
    )
  }

  handleBooking(booking) {
    booking.kommun = this
    this.fleets
      .pipe(
        expandFleets(), // otherwise pick one at random
        pickRandom()
      )
      .subscribe((fleet) => fleet.handleBooking(booking))

    if (booking.finalDestination?.position) {
      booking.once('delivered', () => {
        booking.pickup = booking.destination
        booking.destination = booking.finalDestination

        // Create a private car to pickup the package from the nearestOmbud
        // https://transportstyrelsen.se/sv/vagtrafik/statistik/Statistik-over-koldioxidutslapp/statistik-over-koldioxidutslapp-2020/
        const weight = 1500
        const co2perkm = 125 // gram
        const privateCar = new Car({
          position: booking.destination.position,
          weight,
          capacity: 2,
          co2PerKmKg: co2perkm / 1000 / weight,
        })
        privateCar.handleBooking(booking)
        this.privateCars.next(privateCar)
      })
    }
    return booking
  }
}

module.exports = Kommun
