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
        departure: center,
        destination: nearCenter,
      })
    }
  )
}

const bookingStream = postombud()
  .fork()
  .filter((postombud) => postombud.kommun === 'Ljusdal') // only ljusdal for now
  .flatMap(postombud => _(randomizeBooking(postombud.position))) // one booking per postombud
  .tap(b => console.log(`booking`))

module.exports = bookingStream