/*
 * Simulates bookings related to Ljusdal 
 */

const _ = require('highland')
const address = require('../address')
const postombud = require('../../streams/postombud')


let id = 1

function randomizeBooking(center) {
  return Promise.all([center, address.randomize(center)]).then(
    async ([center, nearCenter]) => {
      // console.log('randomizeBooking', center)
      // todo: return more than one
      return ({
        id: id++,
        bookingDate: new Date(),
        departure: nearCenter,
        destination: center,
      })
    }
  )
}

const bookingStream = postombud()
  .filter((postombud) => postombud.kommun === 'Ljusdal') // only ljusdal for now
  .map(postombud => (randomizeBooking(postombud.position))) // one booking per postombud


module.exports = bookingStream