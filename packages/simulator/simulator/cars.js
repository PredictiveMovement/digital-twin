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

const FLEET_MAP = []
const getFleet = (carId, fleets, numberOfCars) => {
  if (!FLEET_MAP.length) {
    const sortedFleets = fleets.sort((a, b) => (a.market > b.market) ? 1 : ((b.market > a.market) ? -1 : 0))

    sortedFleets.forEach(fleet => {
      const carsInFleet = Math.floor(fleet.market * numberOfCars)

      for (let i = carsInFleet; i >= 0 && FLEET_MAP.length < numberOfCars; i--) {
        FLEET_MAP.push(fleet.name)
      }
    })

    if (FLEET_MAP.length < numberOfCars) {
      for (let i = FLEET_MAP.length; i < numberOfCars; i++) {
        FLEET_MAP.push('Övriga')
      }
    }

    info('Car fleet distribution', FLEET_MAP)
  }

  return FLEET_MAP[carId - 1]
}

function generateCars(fleets, initialPositions, numberOfCars, speed = SPEED) {
  info(`Generate cars`, fleets[0])

  return from(initialPositions).pipe(
    // if we need more than initial positions we just expand the initial array until we have as many as we want
    expand(() => from(initialPositions)),
    take(numberOfCars),
    shuffle(),
    //concatMap(position => withLatestFrom(address.randomize(position))),
    map((position) => new Car({ id: carId++, position, timeMultiplier: speed, fleet: getFleet(carId, fleets, numberOfCars) })),
    shareReplay()
  )
}

module.exports = { generateCars }
