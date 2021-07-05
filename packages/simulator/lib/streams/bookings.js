/**
 * Generate bookings from $postombud, in a random position near a hub
 */

const { from } = require('rxjs');
const { map, mergeMap, take } = require('rxjs/operators');
const address = require('../address');
const postombud$ = require('./postombud')

let id = 1
function randomizeBooking(center) {
  return from(address.randomize(center))
    .pipe(
      map(nearCenter => {
        return {
          id: id++,
          bookingDate: new Date(),
          departure: center,
          destination: nearCenter,
        }
      })
    )
}

module.exports = postombud$.pipe(
  mergeMap(booking => randomizeBooking(booking.position)),
)
