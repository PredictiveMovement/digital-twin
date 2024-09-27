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
  tap,
  of,
} = require('rxjs')
const Fleet = require('./fleet')
const { error } = require('./log')
const { searchOne } = require('./pelias')

class Municipality {
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

    console.log('Fleet:', fleets)

    this.fleets = from(fleets).pipe(
      mergeMap(async (fleet) => {
        const hub = fleet.hubAddress
          ? await searchOne(fleet.hubAddress)
              .then((r) => r.position)
              .catch((err) => error(err) || center)
          : center

        return new Fleet({ hub, ...fleet, municipality: this })
      }),
      tap((processedFleet) =>
        console.log('Fleet processed: ', processedFleet.name)
      ), // Log each processed fleet
      shareReplay()
    )

    this.recycleTrucks = this.fleets.pipe(
      mergeMap((fleet) => fleet.cars),
      filter((car) => car.vehicleType === 'recycleTruck'),
      catchError((err) => {
        error('recycleTrucks -> fleet', err)
      })
    )

    this.dispatchedBookings = merge(
      this.recycleCollectionPoints.pipe(
        mergeMap((booking) =>
          this.fleets.pipe(
            mergeMap((fleet) =>
              from(fleet.canHandleBooking(booking)).pipe(
                filter(Boolean),
                mergeMap(() => from(fleet.handleBooking(booking))),
                catchError((err) => {
                  error(`Error handling booking ${booking.id}:`, err)
                  return of(null)
                })
              )
            ),
            first((result) => result !== null, null)
          )
        ),
        filter((result) => result !== null),
        catchError((err) => {
          error('municipality dispatchedBookings err', err)
          return of(null)
        })
      )
    )

    this.cars = merge(
      this.privateCars,
      this.fleets.pipe(mergeMap((fleet) => fleet.cars))
    ).pipe(shareReplay())
  }
}

module.exports = Municipality
