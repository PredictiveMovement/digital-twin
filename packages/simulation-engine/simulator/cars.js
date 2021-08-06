const address = require('./address')
const Car = require('../lib/car')
const { from, shareReplay } = require('rxjs')
const { expand, concatMap, take, map, toArray, mergeAll, withLatestFrom } = require('rxjs/operators')
let carId = 0

const shuffle = () => observable => observable.pipe( 
  toArray(),
  map(positions => positions.sort((a, b) => Math.random() - 0.5)),
  mergeAll(),
)

function generateCars(initialPositions, numberOfCars) {
  return from(initialPositions).pipe(
    // if we need more than initial positions we just expand the initial array until we have as many as we want
    expand(() => from(initialPositions)),
    take(numberOfCars),
    shuffle(),
    //concatMap(position => withLatestFrom(address.randomize(position))),
    map((position) => new Car({id: carId++, position})),
    shareReplay()
  )
}

module.exports = { generateCars }
