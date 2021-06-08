/* eslint-disable no-undef */
const _ = require('highland')
const address = require('./address')
const Car = require('../lib/car')
//const positions = require('./positions')
const range = (length) => Array.from({ length }).map((value, i) => i)
const engine = require('../lib/engine')
let carId = 0
const center = { lat: 61.829182, lon: 16.0896213 } //ljusdal
const hub = { lat: 61.820734, lon: 16.058911 }
const heading = { lat: 61.8215838, lon: 16.0610476 }
const pinkData = require('./pinkData')

/*
 * This file if for simulating routes in Ljusdal
 * Dringing from the hub and dropping package off in Los and
 *
 */

function getAddressFromData() {
  // pinkData

  // console.log()
  const position = {
    lon: pinkData[0].lon,
    lat: pinkData[0].lat,
  }

  return address.nearest(position)
  // .then((pos) => (pos === null ? randomize(center, retry--) : pos))
}

function generateCar(nr, fromAddress = hub, toAddress = heading) {
  return _(
    Promise.all([fromAddress, toAddress])
      .then(([from, to]) => {
        const car = new Car(nr, [from, to])
        car.position = from
        car.navigateTo(to)
        console.log('initiated pink car', car.id)
        console.log('pinkData', pinkData[0])
        car.on('dropoff', () => {
          console.log('arrived at dropoff', car.id)
          getAddressFromData().then((position) => {
            console.log('POSITION', position)
            car.navigateTo(position)
          })
          // address.randomize(from).then((position) => car.navigateTo(position))
        })
        return car
      })
      .catch((err) => console.error('simulation error', err))
  )
}

module.exports = _(range(1))
  .flatMap(generateCar)
  //   .tap((car) => console.log('tap', car))
  .errors((err) => console.error('initialize error', err))
  .map((car) => _('moved', car))
  .errors((err) => console.error('move error', err))
  .merge()
