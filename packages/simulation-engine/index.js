const { generateBookingsInKommun } = require('./simulator/bookings')
const { generateCarsInKommun } = require('./simulator/cars')
const postombud = require('./streams/postombud')

module.exports = {
  bookings: generateBookingsInKommun('Arjeplog', ),
  cars: generateCarsInKommun('Arjeplog', 10),
  postombud
  // TODO: add booking volume somewhere
}