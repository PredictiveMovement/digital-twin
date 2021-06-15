/*
 * Simulates a specific logistics company in Ljusdal
 */

/* eslint-disable no-undef */
const _ = require('highland')
const address = require('../address')
const Car = require('../../lib/car')
// const center = { lat: 61.829182, lon: 16.0896213 } //ljusdal
const hub = { lat: 61.820734, lon: 16.058911 }

const NR_CARS = 5

/*
 * Return an array with the provided length
 */
const range = (length) => Array.from({ length }).map((value, i) => i)

let id = 1;
function generateCar(nr) {
  const car = new Car(id++, [hub, null])
  car.position = hub

  return car
}

module.exports = _(range(NR_CARS).map((idx) => generateCar(idx)))

