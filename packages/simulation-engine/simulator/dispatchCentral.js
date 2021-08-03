const { from, concatMap, bufferTime } = require('rxjs')
const { toArray, map, first, tap, filter } = require('rxjs/operators')
const { haversine } = require('../lib/distance')

const dispatch = (cars, bookings) => bookings.pipe(
  concatMap((booking) => cars.pipe(
    map((car) => ({car, distance: haversine(car.position, booking.pickup.position)})),
    bufferTime(300), // to be able to sort we have to batch somehow. Lets start with time
    map((cars) => cars.sort((a, b) => a.distance - b.distance).shift()?.car),
    filter(car => car), // wait until we have a car
    tap(car => console.log('*** dispatch car', car.id, 'to booking', booking.id)),
    // naive dispatch, just pick the first car that is closest to the pickup
    map(car => ({car, booking: car.handleBooking(booking)}))
  ))
)

module.exports = {
  dispatch
}