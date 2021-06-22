/*
 * Simulates a specific logistics company in Ljusdal
 */

/* eslint-disable no-undef */
const _ = require('highland')
const address = require('../address')
const Car = require('../../lib/car')
// const center = { lat: 61.829182, lon: 16.0896213 } //ljusdal
const hub = { lat: 61.820734, lon: 16.058911 }
const bookings = require('./bookings').fork()

const NR_CARS = 1

// bookings.each(b => console.log('b: ', b))


/*
 * Return an array with the provided length
 */
const range = (length) => Array.from({ length }).map((value, i) => i)

let id = 1;
function generateCar(nr) {
  console.log('generate', id)
  const car = new Car(id++, [hub, null])
  car.position = hub
  car.on('ready', () => {
    console.log('ready, handle new booking')
    bookings.pull((err, booking) => car.handleBooking(booking))
  })
  car.ready()

  return car;

  // TODO: pull a booking from the bookings stream. Send it to the car and wait for an event hwe
  // bookings.

}

const theStream = _(range(NR_CARS)).map((idx) => generateCar(idx))

module.exports = theStream;

