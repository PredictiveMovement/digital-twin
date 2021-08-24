const address = require('./address')
const Car = require('../lib/car')
const { from, shareReplay } = require('rxjs')
const { expand, concatMap, take, map, mapTo, reduce, toArray, mergeAll, withLatestFrom, zipWith } = require('rxjs/operators')
let carId = 0
const SPEED = 360 // multiplier.

const { info } = require('../lib/log')

const shuffle = () => observable => observable.pipe(
  toArray(),
  map(positions => positions.sort((a, b) => Math.random() - 0.5)),
  mergeAll(),
)

const range = (length) => Array.from({ length })

// Return a list of n = numberOfCars fleet names based on their percentage distribution
const getFleets = (fleets, numberOfCars) => from(fleets
  .sort((a, b) => a.market - b.market)
  .reduce((FLEET_MAP, fleet) => {
    const carsInFleet = Math.ceil(fleet.market * numberOfCars)
    return [...FLEET_MAP, ...range(carsInFleet).map(() => fleet.name)]
  }, []))

// Generate desired number of cars and expand the array if there are too few
const expandArray = (initialPositions, numberOfCars) => from(initialPositions).pipe(
  // if we need more than initial positions we just expand the initial array until we have as many as we want
  expand(() => from(initialPositions)),
  take(numberOfCars),
  shuffle()
)

function generateCars(fleets, initialPositions, numberOfCars, speed = SPEED) {
  return getFleets(fleets, numberOfCars).pipe(
    zipWith(expandArray(initialPositions, numberOfCars)),
    //concatMap(position => withLatestFrom(address.randomize(position))),
    map(([fleet, position]) => new Car({ id: carId++, position, timeMultiplier: speed, fleet })),
    shareReplay()
  )
}

module.exports = { generateCars }
