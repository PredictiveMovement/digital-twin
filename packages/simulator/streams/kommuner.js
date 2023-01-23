/**
 * TODO: Describe the stream that this file exports and what its data means
 */
const { from, shareReplay, merge, of } = require('rxjs')
const { map, filter, reduce, mergeMap } = require('rxjs/operators')
const Kommun = require('../lib/kommun')
const data = require('../data/kommuner.json')
const population = require('./population')
const packageVolumes = require('./packageVolumes')
const postombud = require('./postombud')
const measureStations = require('./measureStations')
const inside = require('point-in-polygon')
const commercialAreas = from(require('../data/scb_companyAreas.json').features)
const Pelias = require('../lib/pelias')
const { getCitizensInSquare } = require('../simulator/citizens')
const { convertPosition } = require('../lib/distance')
const coords = require('swe-coords')
const Position = require('../lib/models/position')
const { getAddressesInArea } = require('../simulator/address')
const { includedMunicipalities } = require('../config')
const { info } = require('../lib/log')

const bookings = {
  hm: require('../streams/orders/hm.js'),
  ikea: require('../streams/orders/ikea.js'),
}

function getPopulationSquares({ geometry: { coordinates } }) {
  return population.pipe(
    filter(({ position: { lon, lat } }) =>
      coordinates.some((coordinates) => inside([lon, lat], coordinates))
    ),
    map(({ position, population, area }) => ({
      position,
      population,
      area: +area,
    })), // only keep the essentials to save memory
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
      info(
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

function getWorkplaces(commercialAreas) {
  return commercialAreas.pipe(
    mergeMap(async (commercialArea) => {
      const {
        X_koord: x,
        Y_koord: y,
        AREA_HA: area,
        ARBST_DETH: nrOfWorkplaces,
      } = commercialArea.properties
      const position = new Position(
        convertPosition(coords.toLatLng(y.toString(), x.toString()))
      )
      const adresses = await getAddressesInArea(position, area, nrOfWorkplaces)
      return adresses
    }),
    shareReplay()
  )
}

// function read() {
function read({ fleets }) {
  const workplaces = getWorkplaces(commercialAreas)

  return from(data).pipe(
    filter(({ namn }) =>
      includedMunicipalities.some((name) => namn.startsWith(name))
    ),
    map((kommun) => {
      return {
        ...kommun,
        fleets: fleets[kommun.namn]?.fleets?.length
          ? fleets[kommun.namn].fleets
          : [],
      }
    }),
    mergeMap(
      async ({
        geometry,
        namn: name,
        epost,
        postnummer,
        telefon,
        kod,
        pickupPositions,
        fleets,
      }) => {
        const squares = getPopulationSquares({ geometry })
        const commercialAreas = getCommercialAreas(kod)
        const center = await centerPoint(name)
        const nearbyWorkplaces = workplaces.pipe(
          filter((workplace) => {
            //  TODO: Get statistics on how far people travel to work.
            return workplace.position.distanceTo(center) < 100000 // TODO: Make this configurable on kommun
          })
        )
        const citizens = squares.pipe(
          mergeMap(
            (square) => getCitizensInSquare(square, nearbyWorkplaces, name),
            1
          )
        )

        const kommun = new Kommun({
          geometry,
          name,
          id: kod,
          email: epost,
          zip: postnummer,
          telephone: telefon,
          fleets: fleets || [],
          center,
          pickupPositions: pickupPositions || [],
          squares,
          postombud: getPostombud(name),
          measureStations: getMeasureStations(name),
          population: await squares
            .pipe(reduce((a, b) => a + b.population, 0))
            .toPromise(),
          packageVolumes: packageVolumes.find((e) => name.startsWith(e.name)),
          commercialAreas: commercialAreas,
          unhandledBookings: name.startsWith('Helsingborg')
            ? merge(bookings.hm, bookings.ikea)
            : of(),
          citizens,
        })
        return kommun
      }
    ),
    shareReplay()
  )
}

module.exports = { read }
