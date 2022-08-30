const {
  takeUntil,
  tap,
  take,
  filter,
  map,
  mergeMap,
  mergeAll,
  concatMap,
  toArray,
  shareReplay,
  mergeWith,
  zipWith,
  withLatestFrom,
} = require('rxjs/operators')
const perlin = require('perlin-noise')

const pelias = require('../lib/pelias')
const { addMeters } = require('../lib/distance')
const Passenger = require('../lib/models/passenger')
const { generateNames } = require('../lib/personNames')
const { virtualTime } = require('./../lib/virtualTime')
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

const generatePassengers = (kommuner) =>
  kommuner.pipe(
    mergeMap((kommun) => {
      return kommun.squares.pipe(
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
            const home = await pelias.nearest(homePosition)
            return { home, workPosition }
          } catch (e) {
            return null
          }
        }),
        filter((p) => p),
        concatMap(async ({ home, workPosition }) => {
          try {
            const work = await pelias.nearest(workPosition)
            return { home, work, kommun }
          } catch (e) {
            return null
          }
        }),
        filter((p) => p),
        zipWith(generateNames()),
        map(([props, name]) =>
          createPassengerFromAddress({ ...props, ...name })
        )
      )
    }),
    take(100),
    shareReplay() // ShareReplay needed to keep ID's and names consistent between console and visualisation
  )
const createPassengerFromAddress = ({ home, work, kommun, name }) => {
  const residence = {
    name: `${home.name}, ${home.localadmin}`,
    ...home,
  }
  const workplace = {
    name: `${work.name}, ${work.localadmin}`,
    ...work,
  }

  return new Passenger({
    position: home.position,
    startPosition: home.position,
    workplace: workplace,
    kommun: kommun,
    home: residence,
    name: name,
  })
}

module.exports = {
  generatePassengers,
}
