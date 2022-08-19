/**
 * TODO: Describe the stream that this file exports and what its data means
 */
const { from, shareReplay, withLatestFrom, merge } = require('rxjs')
const { map, tap, filter, reduce, finalize, share } = require('rxjs/operators')
const Kommun = require('../lib/kommun')
const data = require('../data/kommuner.json')
const population = require('./population')
const packageVolumes = require('./packageVolumes')
const postombud = require('./postombud')
const inside = require('point-in-polygon')
const commercialAreas = from(require('../data/scb_companyAreas.json').features)
const { generateBookingsInKommun } = require('../simulator/bookings')
const bookingsCache = require('../streams/cacheBookingStream')

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
      [
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
      ].some((name) =>
        namn.startsWith(name)
      )
    ),
    map(
      ({
        geometry,
        namn,
        epost,
        postnummer,
        telefon,
        kod,
        pickupPositions,
        fleets,
      }) =>
        new Kommun({
          geometry,
          name: namn,
          id: kod,
          email: epost,
          zip: postnummer,
          telephone: telefon,
          fleets: fleets || [],
          pickupPositions: pickupPositions || [],
          squares: getPopulationSquares({ geometry }),
          postombud: getPostombud(namn),
          packageVolumes: packageVolumes.find((e) => namn.startsWith(e.name)),
          commercialAreas: getCommercialAreas(kod),
          busCount: 5,
        })
    ),
    // ),
    // map((kommun) => {
    //   kommun.bookings = merge(
    //     bookingsCache.read(__dirname + `/.cache/pm_bookings_${kommun.id}.json`),
    //     generateBookingsInKommun(kommun),
    //     share()
    //   )
    //   kommun.bookings.pipe(
    //     bookingsCache.write(__dirname + `/.cache/pm_bookings_${kommun.id}.json`)
    //   )
    //   return kommun
    // }),

    shareReplay()
  )
}

const kommuner = (module.exports = read())

// kommuner.pipe(filter((k) => k.name === 'Arjeplogs kommun')).subscribe((kommun) => console.dir(kommun, { depth: null }))
//population.pipe(take(50)).subscribe(p => console.dir(p,  { depth: null }))

//console.log('inside?', inside([17.1181455372, 58.6721047703], kommun))
