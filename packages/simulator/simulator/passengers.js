const {
  take,
  filter,
  map,
  mergeMap,
  concatMap,
  toArray,
  shareReplay,
  zipWith,
} = require('rxjs/operators')
const perlin = require('perlin-noise')

const pelias = require('../lib/pelias')
const { addMeters } = require('../lib/distance')
const Passenger = require('../lib/models/passenger')
const { randomNames } = require('../lib/personNames')
const { randomize } = require('./address')

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

const generatePassengers = (kommun) =>
  kommun.squares.pipe(
    mergeMap(({ population, position }) =>
      randomPositions
        .slice(0, population)
        .map(({ x, y }) => addMeters(position, { x, y }))
    ),
    mergeMap((homePosition) => {
      return kommun.postombud.pipe(
        toArray(),
        mergeMap(async (postombudInKommun) => {
          const randomPostombud =
            postombudInKommun[
              Math.floor(Math.random() * postombudInKommun.length)
            ]
          const workPosition = await randomize(randomPostombud.position)
          return { homePosition, workPosition }
        })
      )
    }, 20),
    concatMap(async ({ homePosition, workPosition }) => {
      try {
        const home = await pelias.nearest(homePosition, 'address')
        return { home, workPosition }
      } catch (e) {
        return null
      }
    }),
    filter((p) => p),
    concatMap(async ({ home, workPosition }) => {
      try {
        const workplace = await pelias.nearest(workPosition)
        return { home, workplace }
      } catch (e) {
        return null
      }
    }),
    filter((p) => p),
    zipWith(randomNames.pipe(take(1))),
    map(
      ([{ home, workplace }, { name, firstName, lastName }]) =>
        new Passenger({
          position: home.position,
          workplace,
          kommun,
          home,
          name,
          firstName,
          lastName,
        })
    ),
    take(kommun.population / 100) // sample 1% of the population
  )

module.exports = {
  generatePassengers,
}
