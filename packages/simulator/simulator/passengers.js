const {
  takeUntil,
  tap,
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

const polarbrödÄlvsByn = {
  lat: 65.669641,
  lon: 20.975453,
}

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
    bufferTime(12000, 2500000)
  )

const createPassengerFromAddress = ({ position }) =>
  new Passenger({
    pickup: position,
    id: safeId(),
    position: position,
    destination: polarbrödÄlvsByn,
    name: 'Genomsnittlig snubbe',
  })

module.exports = {
  generatePassengers,
}
