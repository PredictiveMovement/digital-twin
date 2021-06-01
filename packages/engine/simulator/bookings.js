const _ = require('highland')
const randomAddress = require('./address')

let id = 1

function randomizeBooking () {
  return Promise.all([randomAddress(), randomAddress()]).then(addresses => ({
    id: id++,
    bookingDate: new Date(),
    departure: addresses[0],
    destination: addresses[1]
  }))
}

module.exports = _(function (push, next) {
  randomizeBooking()
    .then(booking => push(null, booking))
    .then(_ => setTimeout(next, 5000))
})
