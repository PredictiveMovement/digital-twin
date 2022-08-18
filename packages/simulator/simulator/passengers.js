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
} = require('rxjs/operators')
const perlin = require('perlin-noise')

const pelias = require('../lib/pelias')
const { addMeters } = require('../lib/distance')
const Passenger = require('../lib/models/passenger')
const personNames = require('../lib/personNames')
const { virtualTime } = require('./../lib/virtualTime')
const { randomize } = require('./address')

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
    mergeMap(({ squares, postombud, name }) => {
      return squares.pipe(
        mergeMap(({ population, position }) =>
          randomPositions
            .slice(0, population)
            .map(({ x, y }) => addMeters(position, { x, y }))
        ),
        mergeMap( (homePosition) => {
          return postombud.pipe(
            toArray(),
            mergeMap(async (all_postombud) => {
              const randomPostombud =
                all_postombud[Math.floor(Math.random() * all_postombud.length)]
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
            return { home, work }
          } catch (e) {
            return null
          }
        }),
        filter((p) => p),
        map(createPassengerFromAddress)
      )
    }),
    take(100),
    shareReplay(), // ShareReplay needed to keep ID's and names consistent between console and visualisation
    toArray()
  )
const createPassengerFromAddress = ({ home, work }) => {
  const residence = { name: `${home.name}, ${home.localadmin}`, ...home.position}
  const workplace = { name: `${work.name}, ${work.localadmin}`, ...work.position}

  const offset = virtualTime.offset // Sim starts at an offset from midnight, so we need to subctract that offset from the time
  const fiveAm  = (5 * 60 * 60) - offset
  const tenAm   = (10 * 60 * 60) - offset
  const threePm = (15 * 60 * 60) - offset
  const eightPm = (20 * 60 * 60) - offset
  const name = names[Math.floor(Math.random() * names.length)]

  return new Passenger({
    journeys: [
      { pickup: residence, destination: workplace, timeWindow: [[fiveAm, tenAm]]},
      { pickup: workplace, destination: residence, timeWindow: [[threePm, eightPm]]},
    ],
    position: home.position,
    name: name,
  })
}


module.exports = {
  generatePassengers,
}
