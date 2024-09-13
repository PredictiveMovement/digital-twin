/**
 * TODO: Describe the stream that this file exports and what its data means
 */
const { from, shareReplay } = require('rxjs')
const {
  map,
  filter,
  reduce,
  mergeMap,
  mergeAll,
  take,
  repeat,
  share,
} = require('rxjs/operators')
const Municipality = require('../lib/municipality.js')
const Position = require('../lib/models/position.js')
const data = require('../data/municipalities.json')
const population = require('./population.js')
const packageVolumes = require('./packageVolumes.js')
const postombud = require('./postombud.js')
const inside = require('point-in-polygon')
const Pelias = require('../lib/pelias.js')
const { getCitizensInSquare } = require('../simulator/citizens.js')
const { getAddressesInArea } = require('../simulator/address.js')
const { municipalities } = require('../config/index.js')
const commercialAreas = from(require('../data/scb_companyAreas.json').features)

const activeMunicipalities = municipalities()

const bookings = {
  telge: require('./orders/telge.js'),
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

function getCommercialAreas(municipalityId) {
  return commercialAreas.pipe(
    filter((area) => area.properties.KOMMUNKOD === municipalityId),
    shareReplay()
  )
}

function getPostombud(municipalityName) {
  return postombud.pipe(
    filter((ombud) => municipalityName.startsWith(ombud.municipality)),
    shareReplay()
  )
}
async function getWorkplaces(position, nrOfWorkplaces = 100) {
  const area = 10000
  const adresses = await getAddressesInArea(position, area, nrOfWorkplaces)
  return adresses.map((a) => ({ ...a, position: new Position(a.position) }))
}

// function read() {
function read({ fleets }) {
  return from(data).pipe(
    filter(({ namn }) =>
      activeMunicipalities.some((name) => namn.startsWith(name))
    ),
    map((municipality) => {
      return {
        ...municipality,
        fleets: fleets[municipality.namn]?.fleets?.length
          ? fleets[municipality.namn].fleets
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
        address,
        kod,
        pickupPositions,
        fleets,
      }) => {
        console.log('🏢 Processing municipality', name)
        //console.log('Municipality fleets', fleets)
        const squares = getPopulationSquares({ geometry })
        const commercialAreas = getCommercialAreas(kod)

        const searchQuery = address || name.split(' ')[0]

        const searchResult = await Pelias.searchOne(searchQuery)
        if (!searchQuery || !searchResult || !searchResult.position) {
          throw new Error(
            `No valid address or name found for municipality: ${name}. Please check parameters.json and add address or position for this municipality. ${searchQuery}`
          )
        }

        const { position: center } = searchResult
        const nearbyWorkplaces = from(getWorkplaces(center)).pipe(
          mergeAll(),
          take(100),
          repeat()
        )

        const citizens = squares.pipe(
          mergeMap(
            (square) => getCitizensInSquare(square, nearbyWorkplaces, name),
            5
          ),
          shareReplay()
        )

        const municipality = new Municipality({
          geometry,
          name,
          id: kod,
          email: epost,
          zip: postnummer,
          telephone: telefon,
          fleets: fleets || [],
          recycleCollectionPoints: bookings.telge, // if södertälje..
          center,
          pickupPositions: pickupPositions || [],
          squares,
          postombud: getPostombud(name),
          population: await squares
            .pipe(reduce((a, b) => a + b.population, 0))
            .toPromise(),
          packageVolumes: packageVolumes.find((e) => name.startsWith(e.name)),
          commercialAreas: commercialAreas,

          citizens,
        })
        return municipality
      }
    ),
    share()
  )
}

module.exports = { read }
