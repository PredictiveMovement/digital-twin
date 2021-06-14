/* eslint-disable no-undef */
const _ = require('highland')
const address = require('../address')
const Car = require('../../lib/car')
// const positions = require('./positions')
// const engine = require('../../lib/engine')
// let carId = 0
// const center = { lat: 61.829182, lon: 16.0896213 } //ljusdal
const hub = { lat: 61.820734, lon: 16.058911 }
// const heading = { lat: 61.8215838, lon: 16.0610476 }

const NR_CARS = 5
// const bookings = require('./bookings')

/*
 * Return an array with the provided length
 */
const range = (length) => Array.from({ length }).map((value, i) => i)

/*
 * This file is for simulating routes in Ljusdal
 * Bringing from the hub and dropping package off in Los and
 *
 */

let id = 1;
function generateCar(nr) {
  const car = new Car(id++, [hub, null])
  car.position = hub
  // car.navigateTo(to)
  // console.log('initiated pink car', car.id)
  // // console.log('pinkData', pinkData[0])
  // car.on('dropoff', () => {
  //   //TODO lägg tillbaka bilen i bilström

  //   console.log('arrived at dropoff', car.id)
  //   bookings.fork().pull((err, booking) => {
  //     if (err) return console.error(err)
  //     console.log('handle booking', booking)
  //     car.handleBooking(booking)
  //   })
  // })
  return car
}

module.exports = _(range(NR_CARS).map((idx) => generateCar(idx)))

  // .flatMap(generateCar)
  //   .tap((car) => console.log('tap', car))
  // .errors((err) => console.error('initialize error', err))
  // .map((car) => _('moved', car))
  // .doto(car => console.log('position', car.id, car.position))
  // .errors((err) => console.error('move error', err))
  // .merge()
