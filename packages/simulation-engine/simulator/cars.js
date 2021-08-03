const address = require('./address')
const Car = require('../lib/car')
const { from } = require('rxjs')
const { retry } = require('rxjs/operators')
let carId = 0

const { filter, take, mergeMap } = require('rxjs/operators')
const postombud = require('../streams/postombud')
/*
  Generate a car that continously moves around the postombud until being dispatched
*/
function generateCar(nr, from, to) {
  const car = new Car(nr, [from, to])
  car.position = from
  car.navigateTo(to)
  // wander around on the streets silently forever
  car.on('stopped', async car => {
    if (!car.busy) {
      const next = await address.randomize(to)
      // console.log('stopped moving to', next)
      car.navigateTo(next)
    }
  })
  console.log('initiated car', car.id)
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
    ),
    retry(5)
  )
}

module.exports = { generateCarsInKommun }
