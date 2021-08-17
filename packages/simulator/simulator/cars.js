const address = require('./address')
const Car = require('../lib/car')
const { from, shareReplay } = require('rxjs')
const { expand, concatMap, take, map, toArray, mergeAll, withLatestFrom } = require('rxjs/operators')
let carId = 0
const SPEED = 60 // multiplier.

const { info } = require('../lib/log')

const shuffle = () => observable => observable.pipe(
  toArray(),
  map(positions => positions.sort((a, b) => Math.random() - 0.5)),
  mergeAll(),
)

// TODO: Randomize using the fleet's respective market weights
const getRandomFleet = fleets => {
  const probability = Math.ceil(Math.random() * 100)

  const sortedByProbability = fleets.sort((a, b) => {
    const first = Math.ceil(a.market * 100 / probability)
    const second = Math.ceil(b.market * 100 / probability)

    return first < second ? 1 : -1
  })

  const fleet = sortedByProbability[0].name
  info(`Generate a car belonging to ${fleet}`)

  return fleet
}

function generateCars(fleets, initialPositions, numberOfCars, speed = SPEED) {
  info(`Generate cars ${fleets[0]}`)

  return from(initialPositions).pipe(
    // if we need more than initial positions we just expand the initial array until we have as many as we want
    expand(() => from(initialPositions)),
    take(numberOfCars),
    shuffle(),
    //concatMap(position => withLatestFrom(address.randomize(position))),
    map((position) => new Car({ id: carId++, position, timeMultiplier: speed, fleet: getRandomFleet(fleets) })),
    shareReplay()
  )
}

module.exports = { generateCars }
