const {
  from,
  shareReplay,
  Subject,
  ReplaySubject,
  mergeMap,
  merge,
  range,
} = require('rxjs')
const {
  catchError,
  map,
  toArray,
  filter,
  tap,
  retryWhen,
  delay,
} = require('rxjs/operators')
const Fleet = require('./fleet')
const { error } = require('./log')
const { searchOne } = require('./pelias')
const expandFleets = () => (fleets) =>
  fleets.pipe(
    mergeMap((fleet) => range(0, fleet.marketshare * 10).pipe(map(() => fleet)))
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
    citizens,
    squares,
    fleets,
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
    this.busesPerCapita = 100 / 80_000
    this.population = population
    this.privateCars = new ReplaySubject()
    this.unhandledBookings = new Subject()

    this.co2 = 0
    this.citizens = citizens

    this.fleets = from(fleets).pipe(
      mergeMap(async (fleet) => {
        const hub = fleet.hubAddress
          ? await searchOne(fleet.hubAddress)
              .then((r) => r.position)
              .catch((err) => error(err) || center)
          : center

        return new Fleet({ hub, ...fleet, kommun: this })
      }),
      shareReplay()
    )

    this.cars = merge(
      this.privateCars,
      this.fleets.pipe(
        filter((fleet) => fleet.type !== 'bus'),
        mergeMap((fleet) => fleet.cars)
      )
    ).pipe(shareReplay())

    this.buses = this.fleets.pipe(
      filter((fleet) => fleet.type === 'bus'),
      tap((bus) => (bus.kommun = this)),
      mergeMap((fleet) => fleet.cars),
      shareReplay()
    )

    this.pickNextEligbleFleet = (booking) =>
      this.fleets.pipe(
        mergeMap((fleet) =>
          fleet.canHandleBooking(booking).then((ok) => [ok, fleet])
        ),
        filter(([ok]) => ok),
        map(([, fleet]) => fleet),
        expandFleets(),
        pickRandom(),
        map((fleet) =>
          !fleet
            ? error('No eligble fleet found for booking, retrying...', booking)
            : fleet
        ),
        retryWhen((errors) => errors.pipe(delay(10000))),
        map((fleet) => ({ booking, fleet })),
        catchError((err) => error('pickNextEligbleFleet', err))
      )

    this.dispatchedBookings = merge(
      this.unhandledBookings.pipe(
        mergeMap((booking) => this.pickNextEligbleFleet(booking)),
        mergeMap(({ booking, fleet }) => fleet.handleBooking(booking), 1),
        catchError((err) => error('dispatchedBookings', err)),
        shareReplay()
      ),
      this.fleets.pipe(mergeMap((fleet) => fleet.dispatchedBookings))
    )

    this.handleBooking = (booking) => {
      booking.kommun = this
      this.unhandledBookings.next(booking)
    }
  }
}

module.exports = Kommun
