/**
 * Generate bookings from $postombud, in a random position near a hub
 */

const { from } = require('rxjs');
const { map, mergeMap, take } = require('rxjs/operators');
const address = require('../address');
const postombud$ = require('./postombud')

let id = 1
function randomizeBooking(center, prefix) {
  return from(address.randomize(center))
    .pipe(
      map(nearCenter => {
        return {
          id: `${prefix}-${id++}`,
          bookingDate: new Date(),
          departure: center,
          destination: nearCenter,
        }
      })
    )
}

// module.exports = postombud$.pipe(
//   mergeMap(booking => randomizeBooking(booking.position)),
// )

module.exports = function generate(prefix) {
  return postombud$.pipe(
    mergeMap(booking => randomizeBooking(booking.position, prefix))
  )
}
