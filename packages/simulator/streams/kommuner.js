/**
 * TODO: Describe the stream that this file exports and what its data means
 */
const { from, shareReplay, ReplaySubject, merge, of } = require('rxjs')
const { map, tap, filter, reduce, mergeMap } = require('rxjs/operators')
const Kommun = require('../lib/kommun')
const data = require('../data/kommuner.json')
const population = require('./population')
const packageVolumes = require('./packageVolumes')
const postombud = require('./postombud')
const measureStations = require('./measureStations')
const inside = require('point-in-polygon')
const commercialAreas = from(require('../data/scb_companyAreas.json').features)
const Pelias = require('../lib/pelias')
const { getCitizens } = require('../simulator/citizens')
const { includedMunicipalities, defaultEmitters } = require('../config')

const bookings = {
  hm: require('../streams/orders/hm.js'),
  ikea: require('../streams/orders/ikea.js'),
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
function getMeasureStations(kommunName) {
  return measureStations.pipe(
    filter((measureStation) => kommunName.startsWith(measureStation.kommun)),
    shareReplay()
  )
}

async function centerPoint(namn, retries = 0) {
  try {
    return await Pelias.search(namn).then((res) => res.position)
  } catch (err) {
    if (retries < 3) {
      console.log(
        "Couldn't find center point for",
        namn,
        `retrying ${retries + 1}/3...`
      )
      return centerPoint(namn, retries + 1)
    }
    console.error('Could not find center point for', namn)
    return { lat: 0, lon: 0 }
  }
}

function read({ fleets }) {
  return from(data).pipe(
    filter(({ namn }) =>
      includedMunicipalities.some((name) => namn.startsWith(name))
    ),
    map((kommun) => ({
      ...kommun,
      fleets: fleets[kommun.namn]?.fleets?.length
        ? fleets[kommun.namn].fleets
        : [],
    })),
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
        const kommun = new Kommun({
          geometry,
          name: namn,
          id: kod,
          email: epost,
          zip: postnummer,
          telephone: telefon,
          fleets: fleets || [],
          center: await centerPoint(namn),
          pickupPositions: pickupPositions || [],
          squares,
          postombud: getPostombud(namn),
          measureStations: getMeasureStations(namn),
          population: await squares
            .pipe(reduce((a, b) => a + b.population, 0))
            .toPromise(),
          packageVolumes: packageVolumes.find((e) => namn.startsWith(e.name)),
          commercialAreas: getCommercialAreas(kod),
          unhandledBookings: namn.startsWith('Helsingborg')
            ? merge(bookings.hm, bookings.ikea)
            : of(),
        })
        kommun.citizens = getCitizens(kommun)
        return kommun
      }
    ),
    shareReplay()
  )
}

module.exports = { read }
