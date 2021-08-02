const address = require('./address')
const Car = require('../lib/car')
const { from } = require('rxjs')
let carId = 0

const { filter, take, mergeMap } = require('rxjs/operators')
/*
  Generate a car that continously moves around the postombud until being dispatched
*/
function generateCar(nr, from, to) {
  const car = new Car(nr, [from, to])
  car.position = from
  car.navigateTo(to)
  console.log('initiated car', car.id)
  car.on('dropoff', () => {
    console.log('arrived at dropoff', car.id)
    address.randomize(from).then((position) => car.navigateTo(position))
  })
  return car
}

function generateCarsInKommun(kommun, numberOfCars) {
  return from(kommun.postombud).pipe(
    take(numberOfCars), // TODO: handle more cars than postombud
    mergeMap(async (postombud) =>
      generateCar(
        carId++,
        postombud.position,
        await address.randomize(postombud.position)
      )
    )
  )
}

module.exports = { generateCarsInKommun }
