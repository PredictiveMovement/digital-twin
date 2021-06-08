/* eslint-disable no-undef */
const _ = require('highland')
const address = require('./address')
const Car = require('../lib/car')
//const positions = require('./positions')
const range = (length) => Array.from({ length }).map((value, i) => i)
const engine = require('../lib/engine')
let carId = 0

function generateCar(
  nr,
  fromAddress = address.randomize(),
  toAddress = address.randomize()
) {
  return _(
    Promise.all([fromAddress, toAddress])
      .then(([from, to]) => {
        const car = new Car(nr, [from, to])
        car.position = from
        car.navigateTo(to)
        console.log('initiated car', car.id)
        car.on('dropoff', () => {
          console.log('arrived at dropoff', car.id)
          address.randomize(from).then((position) => car.navigateTo(position))
        })
        return car
      })
      .catch((err) => console.error('simulation error', err))
  )
}

module.exports = (startingPoints) =>
  _(startingPoints)
    .fork()
    .filter((ombud) => ombud.kommun === 'Arjeplog')
    .ratelimit(20, 1000)
    .flatMap((postombud) =>
      // generateCar(
      //   carId++,
      //   address.randomize(postombud.position),
      //   postombud.position
      // )
      _(
        range(1).map((i) =>
          generateCar(
            carId++,
            address.randomize(postombud.position),
            postombud.position
          )
        )
      ).flatten()
    )

    // .tap((car) => console.log("tap", car))
    .errors((err) => console.error('initialize error', err))
    .map((car) => _('moved', car))
    .errors((err) => console.error('move error', err))
    .merge()
