const {
  from,
  shareReplay,
  ReplaySubject,
  mergeMap,
  merge,
  of,
  range,
} = require('rxjs')
const {
  catchError,
  map,
  toArray,
  mapTo,
  groupBy,
  first,
} = require('rxjs/operators')
const Fleet = require('./fleet')
const Bus = require('./vehicles/bus')
const { error } = require('./log')
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

class Kommun {
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
    measureStations,
    unhandledBookings,
    citizens,
    squares,
    fleets,
    busCount,
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
    this.measureStations = measureStations
    this.packageVolumes = packageVolumes
    this.unhandledBookings = unhandledBookings
    this.busesPerCapita = 100 / 80_000
    this.population = population
    this.privateCars = new ReplaySubject()
    this.busCount =
      busCount || Math.max(5, Math.round(this.population * this.busesPerCapita))

    this.co2 = 0
    this.citizens = citizens

    this.fleets = from(
      fleets.map((fleet) => new Fleet({ hub: center, ...fleet }))
    )

    this.cars = merge(
      this.privateCars,
      this.fleets.pipe(mergeMap((fleet) => fleet.cars))
    ).pipe(shareReplay())

    this.buses = range(0, this.busCount).pipe(
      map(() => ({
        startPosition: center,
        position: center,
        heading: center,
        kommun: name,
        stops: from([]),
      })),
      map((props) => new Bus(props))
    )

    this.pickNextFleet = () =>
      this.fleets.pipe(
        expandFleets(),
        pickRandom(),
        catchError((err) => error('pickNextFleet', err))
      )

    this.dispatchedBookings = this.unhandledBookings.pipe(
      mergeMap((booking) =>
        this.pickNextFleet().pipe(
          mergeMap(
            (fleet) => fleet.handleBooking(booking) && fleet.dispatchedBookings,
            1
          )
        )
      ),
      groupBy((booking) => booking.id),
      mergeMap((group) => group.pipe(first())),
      catchError((err) =>
        error('dispatchedBookings -> unhandledBookings.pipe', err)
      ),
      shareReplay()
    )

    //   this.handledBookings = this.unhandledBookings.pipe(
    //     map((booking) => {
    //       booking.kommun = this
    //       this.fleets
    //         .pipe(
    //           expandFleets(), // otherwise pick one at random
    //           pickRandom()
    //         )
    //         .subscribe((fleet) => fleet.handleBooking(booking))

    //       if (booking.finalDestination?.position) {
    //         booking.deliveredEvents.pipe(first()).subscribe(() => {
    //           booking.pickup = booking.destination
    //           booking.destination = booking.finalDestination

    //           // Create a private car to pickup the package from the nearestOmbud
    //           // https://transportstyrelsen.se/sv/vagtrafik/statistik/Statistik-over-koldioxidutslapp/statistik-over-koldioxidutslapp-2020/
    //           const weight = 1500
    //           const co2perkm = 125 // gram
    //           const privateCar = new Car({
    //             position: booking.destination.position,
    //             isPrivateCar: true,
    //             weight,
    //             parcelCapacity: 2,
    //             co2PerKmKg: co2perkm / 1000 / weight,
    //           })
    //           privateCar.handleBooking(booking)
    //           this.privateCars.next(privateCar)
    //         })
    //       }
    //       return booking
    //     })
    //   )
  }
}

module.exports = Kommun
