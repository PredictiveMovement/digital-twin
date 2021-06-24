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
let booking_backlog = []

const NR_CARS = 1
const NR_BOOKINGS = 10

// bookings.each(b => console.log('b: ', b))


for (let i = 0; i < NR_BOOKINGS; i++) {
  bookings.fork()
    .pull((err, booking) => booking_backlog.push(booking))
}

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
    // TODO: take booking from backlog instead of creating a new one
    bookings.fork()
      .pull((err, booking) => car.handleBooking(booking))
  })
  car.ready()

  return car;



}

const theStream = _(range(NR_CARS)).map((idx) => generateCar(idx))

// TODO: also export the booking backlog so frontend can show it
module.exports = { theStream, booking_backlog };

