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
  bufferCount,
  groupBy,
  take,
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
        // Buffra 1000 bokningar innan vi processar dem
        bufferCount(1000),
        // Gruppera bokningarna baserat på postnummer
        mergeMap((bookings) =>
          from(bookings).pipe(
            groupBy((booking) => booking.pickup.postalcode),
            // För varje postnummergrupp
            mergeMap((group$) =>
              group$.pipe(
                // Ta den första bokningen i varje grupp
                take(1),
                mergeMap((firstBooking) => {
                  // Här skulle vi skicka till Vroom för planering
                  // TODO: Implementera Vroom-integrering

                  // Simulerar att vi får tillbaka en planerad rutt
                  return of(firstBooking).pipe(
                    mergeMap((plannedBooking) =>
                      // Hitta alla bokningar med samma postnummer
                      from(bookings).pipe(
                        filter(
                          (b) =>
                            b.pickup.postalcode ===
                            plannedBooking.pickup.postalcode
                        ),
                        // Skicka alla matchande bokningar till samma flotta
                        mergeMap((booking) =>
                          this.fleets.pipe(
                            mergeMap((fleet) =>
                              from(fleet.canHandleBooking(booking)).pipe(
                                filter(Boolean),
                                mergeMap(() =>
                                  from(fleet.handleBooking(booking))
                                ),
                                catchError((err) => {
                                  error(
                                    `Error handling booking ${booking.id}:`,
                                    err
                                  )
                                  return of(null)
                                })
                              )
                            ),
                            first((result) => result !== null, null)
                          )
                        )
                      )
                    )
                  )
                })
              )
            )
          )
        ),
        // Filtrera bort null-resultat
        filter((result) => result !== null),
        // Hantera eventuella fel i hela processen
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
