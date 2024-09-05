const {
  from,
  shareReplay,
  Subject,
  ReplaySubject,
  mergeMap,
  merge,
  filter,
  catchError,
  first,
} = require('rxjs')
const Fleet = require('./fleet')
const { error } = require('./log')
const { searchOne } = require('./pelias')

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
    recycleCollectionPoints,
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
    this.recycleCollectionPoints = recycleCollectionPoints
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

    this.buses = this.fleets.pipe(
      mergeMap((fleet) => fleet.cars),
      filter((car) => car.type === 'bus'),
      catchError((err) => {
        error('buses -> fleet', err)
      })
    )

    this.recycleTrucks = this.fleets.pipe(
      mergeMap((fleet) => fleet.cars),
      filter((car) => car.vehicleType === 'recycleTruck'),
      catchError((err) => {
        error('recycleTrucks -> fleet', err)
      })
    )

    this.dispatchedBookings = merge(
      // Should we add more types of bookings?
      this.recycleCollectionPoints.pipe(
        mergeMap((booking) =>
          this.recycleTrucks.pipe(
            filter((fleet) => fleet.canHandleBooking(booking)),
            first(),
            mergeMap((fleet) => fleet.handleBooking(booking))
          )
        ),
        catchError((err) => error('kommun dispatchedBookings err', err))
      )
    )

    this.cars = merge(
      this.privateCars,
      this.fleets.pipe(mergeMap((fleet) => fleet.cars))
    ).pipe(shareReplay())
  }
}

module.exports = Kommun
