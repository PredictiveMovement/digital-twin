/**
 * TODO: Describe the stream that this file exports and what its data means
 */
const { from, shareReplay, merge } = require('rxjs')
const {
  map,
  tap,
  filter,
  reduce,
  mergeMap,
  mergeAll,
  take,
  repeat,
  share,
} = require('rxjs/operators')
const Kommun = require('../lib/kommun')
const Position = require('../lib/models/position')
const data = require('../data/kommuner.json')
const population = require('./population')
const packageVolumes = require('./packageVolumes')
const postombud = require('./postombud')
const inside = require('point-in-polygon')
const Pelias = require('../lib/pelias')
const { getCitizensInSquare } = require('../simulator/citizens')
const { getAddressesInArea } = require('../simulator/address')
const { municipalities } = require('../config')
const commercialAreas = from(require('../data/scb_companyAreas.json').features)

const activeMunicipalities = municipalities()

const bookings = {
  telge: require('../streams/orders/telge.js'),
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
        address,
        kod,
        pickupPositions,
        fleets,
      }) => {
        console.log('Processing kommun', name)
        const squares = getPopulationSquares({ geometry })
        const commercialAreas = getCommercialAreas(kod)

        const searchQuery = address || name.split(' ')[0]

        const searchResult = await Pelias.searchOne(searchQuery)
        if (!searchQuery || !searchResult || !searchResult.position) {
          throw new Error(
            `No valid address or name found for kommun: ${name}. Please check parameters.json and add address or position for this kommun. ${searchQuery}`
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
          population: await squares
            .pipe(reduce((a, b) => a + b.population, 0))
            .toPromise(),
          packageVolumes: packageVolumes.find((e) => name.startsWith(e.name)),
          commercialAreas: commercialAreas,

          citizens,
        })
        return kommun
      }
    ),
    tap((kommun) => {
      console.log('adding bookings for', kommun.name)
      switch (kommun.name) {
        case 'Södertälje':
          merge(bookings.telge).forEach((booking) =>
            kommun.handleBooking(booking)
          )
          break
        case 'Helsingborg':
          merge(bookings.hm, bookings.ikea).forEach((booking) =>
            kommun.handleBooking(booking)
          )
          break
      }
    }),
    share()
  )
}

module.exports = { read }
