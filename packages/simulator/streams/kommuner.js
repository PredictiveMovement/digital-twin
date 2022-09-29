/**
 * TODO: Describe the stream that this file exports and what its data means
 */
const {
  from,
  shareReplay,
  withLatestFrom,
  merge,
  range,
  ReplaySubject,
} = require('rxjs')
const {
  map,
  tap,
  filter,
  reduce,
  finalize,
  share,
  mergeMap,
  count,
} = require('rxjs/operators')
const Kommun = require('../lib/kommun')
const data = require('../data/kommuner.json')
const population = require('./population')
const packageVolumes = require('./packageVolumes')
const postombud = require('./postombud')
const measureStations = require('./measureStations')
const inside = require('point-in-polygon')
const commercialAreas = from(require('../data/scb_companyAreas.json').features)
const { generateBookingsInKommun } = require('../simulator/bookings')
const bookingsCache = require('../streams/cacheBookingStream')
const Pelias = require('../lib/pelias')
const { generatePassengers } = require('../simulator/passengers')
let kommunNames = [
  'Arjeplog',
  'Arvidsjaur',
  'Boden',
  'Gällivare',
  'Haparanda',
  'Jokkmokk',
  'Kalix',
  'Kiruna',
  'Luleå',
  'Pajala',
  'Piteå',
  'Älvsbyn',
  'Överkalix',
  'Övertorneå',
]
if (process.env.PROJECT_NAME === 'Helsingborg') {
  kommunNames = ['Helsingborg']
}

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
    filter(({ namn }) => kommunNames.some((name) => namn.startsWith(name))),
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
      generateBookingsInKommun(kommun).subscribe((booking) =>
        kommun.handleBooking(booking)
      )

      generatePassengers(kommun).subscribe((passenger) =>
        kommun.citizens.next(passenger)
      )
    }),

    shareReplay()
  )
}

const kommuner = (module.exports = read())
