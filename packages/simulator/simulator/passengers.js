const {
  takeUntil,
  tap,
  take,
  filter,
  mergeMap,
  mergeAll,
  concatMap,
  toArray,
} = require('rxjs/operators')
const { timer, bufferTime, windowTime } = require('rxjs')
const pelias = require('../lib/pelias')
const { addMeters } = require('../lib/distance')
const perlin = require('perlin-noise')

const { safeId } = require('../lib/id')
const Passenger = require('../lib/models/passenger')
const personNames = require('../lib/personNames')

const polarbrödÄlvsByn = {
  lat: 65.669641,
  lon: 20.975453,
}

const names = personNames.read()

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })

// generate a pattern of random positions so we can take x out of these and get a natural pattern of these positions
const randomPositions = perlin
  .generatePerlinNoise(100, 100)
  .map((probability, i) => ({
    x: xy(i).x * 10,
    y: xy(i).y * 10,
    probability,
  }))
  .sort((a, b) => b.probability - a.probability) // sort them so we can just pick how many we want

const generatePassengers = (kommuner) =>
  kommuner.pipe(
    mergeMap(({ squares }) =>
      squares.pipe(
        mergeMap(({ population, position }) =>
          randomPositions
            .slice(0, population)
            .map(({ x, y }) => addMeters(position, { x, y }))
        ),
        concatMap((position) =>
          pelias
            .nearest(position)
            .then(createPassengerFromAddress)
            .catch((_) => null)
        ),
        filter((p) => p !== null)
      )
    ),

    take(50),
    toArray()
  )

const createPassengerFromAddress = async ({ position }) => {
  // Everyone goes to and from work, between 5am and 10am and returns between 3pm and 8pm.
  // Also, everyone works at Polarbröd in Älvsbyn
  const fiveAm  = moment().startOf('day').add(5, 'hours')
  const tenAm   = moment().startOf('day').add(10, 'hours')
  const threePm = moment().startOf('day').add(15, 'hours')
  const eightPm = moment().startOf('day').add(20, 'hours')
  const name = names[Math.floor(Math.random() * names.length)]

  return new Passenger({
    journeys: [
      { pickup: position, destination: polarbrödÄlvsByn, timeWindow: [fiveAm, tenAm] },
      { pickup: polarbrödÄlvsByn, destination: position, timeWindow: [threePm, eightPm] },
    ],
    id: safeId(),
    position: position,
    name: name,
  })
}


module.exports = {
  generatePassengers,
}
