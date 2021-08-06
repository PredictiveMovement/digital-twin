const address = require('./address')
const Car = require('../lib/car')
const { from, shareReplay } = require('rxjs')
const { expand, concatMap, take } = require('rxjs/operators')
let carId = 0

const postombud = require('../streams/postombud')

function generateCars(initialPositions, numberOfCars) {
  return from(initialPositions).pipe(
    // if we need more than initial positions we just expand the initial array until we have as many as we want
    expand(() => from(initialPositions)),
    take(numberOfCars),
    concatMap(async (position) => new Car({id: carId++, position})),
    shareReplay()
  )
}

module.exports = { generateCars }
