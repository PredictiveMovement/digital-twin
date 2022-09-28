/**
 * TODO: Describe the stream that this file exports and what its data means
 */
const { from, shareReplay, ReplaySubject } = require('rxjs')
const { map, tap, filter, reduce, mergeMap } = require('rxjs/operators')
const Kommun = require('../lib/kommun')
const data = require('../data/kommuner.json')
const population = require('./population')
const packageVolumes = require('./packageVolumes')
const postombud = require('./postombud')
const inside = require('point-in-polygon')
const commercialAreas = from(require('../data/scb_companyAreas.json').features)
const Pelias = require('../lib/pelias')
const { passengersFromNeeds } = require('../simulator/passengers')
const { includedMunicipalities } = require('../lib/setup')
const { generateBookingsInKommun } = require('../simulator/bookings')

function getPopulationSquares({ geometry: { coordinates } }) {
  return population.pipe(
    filter(({ position: { lon, lat } }) =>
      coordinates.some((coordinates) => inside([lon, lat], coordinates))
    ),
    map(({ position, population }) => ({ position, population })), // only keep the essentials to save memory
    shareReplay()
  )
}

function getCommercialAreas(kommunkod) {
  return commercialAreas.pipe(
    filter((area) => area.properties.KOMMUNKOD === kommunkod),
    shareReplay()
  )
}

function getPostombud(kommunName) {
  return postombud.pipe(
    filter((ombud) => kommunName.startsWith(ombud.kommun)),
    shareReplay()
  )
}

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
          population: await squares
            .pipe(reduce((a, b) => a + b.population, 0))
            .toPromise(),
          packageVolumes: packageVolumes.find((e) => namn.startsWith(e.name)),
          commercialAreas: getCommercialAreas(kod),
        })
      }
    ),
    tap((kommun) => {
      passengersFromNeeds(kommun.name).subscribe((passenger) =>
        kommun.citizens.next(passenger)
      )
      generateBookingsInKommun(kommun)
    }),

    shareReplay()
  )
}

const kommuner = (module.exports = read())
