const { from } = require('rxjs')
const { concatMap } = require('rxjs/operators')


const { generateBookingsInKommun } = require('./simulator/bookings')
const { generateCarsInKommun } = require('./simulator/cars')
const postombud = require('./streams/postombud')
const volumePackages = require('./streams/volumePackages')

module.exports = {
  bookings: generateBookingsInKommun('Arjeplog', 10000), // volumePackages.pipe(concatMap(kommun => generateBookingsInKommun(kommun.namn))),
  cars: generateCarsInKommun('Arjeplog', 10),
  volumePackages,
  postombud
  // TODO: add booking volume somewhere
}