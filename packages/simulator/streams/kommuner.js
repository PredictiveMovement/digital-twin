/**
 * TODO: Describe the stream that this file exports and what its data means
 */
const { from, shareReplay, take, ReplaySubject } = require('rxjs')
const { map, tap, filter, reduce, mergeMap } = require('rxjs/operators')
const Kommun = require('../lib/kommun')
const data = require('../data/kommuner.json')
const packageVolumes = require('./packageVolumes')
const Pelias = require('../lib/pelias')
const { getCitizens } = require('../simulator/citizens')
const { includedMunicipalities, defaultEmitters } = require('../config')
const { generateBookingsInKommun } = require('../simulator/bookings')
const { getPopulationSquares, getCommercialAreas, getPostombud, getMeasureStations} = require('./kommunHelpers')

function read() {
  return from(data).pipe(
    filter(({ namn }) =>
      includedMunicipalities.some((name) => namn.startsWith(name))
    ),
    mergeMap(
      async ({
        geometry,
        namn,
        epost,
        postnummer,
        telefon,
        kod,
        pickupPositions,
        fleets,
      }) => {
        const squares = getPopulationSquares({ geometry })
        return new Kommun({
          geometry,
          name: namn,
          id: kod,
          email: epost,
          zip: postnummer,
          telephone: telefon,
          fleets: fleets || [],
          center: await Pelias.search(namn).then((res) => res.position),
          pickupPositions: pickupPositions || [],
          squares,
          bookings: new ReplaySubject(), // will be set later
          citizens: new ReplaySubject(), // will be set later
          postombud: getPostombud(namn),
          measureStations: getMeasureStations(namn),
          population: await squares
            .pipe(reduce((a, b) => a + b.population, 0))
            .toPromise(),
          packageVolumes: packageVolumes.find((e) => namn.startsWith(e.name)),
          commercialAreas: getCommercialAreas(kod),
        })
      }
    ),
    tap((kommun) => {
      if (defaultEmitters.includes('passengers')) {
        getCitizens(kommun).pipe(take(10)).subscribe((citizen) =>
          kommun.citizens.next(citizen)
        )
      }
      if (defaultEmitters.includes('bookings')) {
        kommun.fleets
          .pipe(take(1)) // We use take(1) to make sure there's atleast one fleet (with a depo) in the kommun. Otherwise bookings shouldn't be generated
          .subscribe(() =>
            generateBookingsInKommun(kommun).subscribe((booking) =>
              kommun.handleBooking(booking)
            )
          )
      }
    }),

    shareReplay()
  )
}

const kommuner = (module.exports = read())
