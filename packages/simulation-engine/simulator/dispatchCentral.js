const { concatMap, timer } = require('rxjs')
const { toArray, map, tap, filter, takeUntil } = require('rxjs/operators')
const { haversine } = require('../lib/distance')

const dispatch = (cars, bookings) => {
  return bookings.pipe(
    concatMap((booking) => cars.pipe(
      map((car) => ({car, distance: haversine(car.position, booking.pickup.position)})),
      takeUntil(timer(500)), // to be able to sort we have to batch somehow. Lets start with time
      toArray(),
      map((cars) => cars.sort((a, b) => a.distance - b.distance).shift()?.car),
      filter(car => car), // wait until we have a car
      // naive dispatch, just pick the first car that is closest to the pickup
      map(car => ({car, booking: car.handleBooking(booking)}))
    ))
  )
}

module.exports = {
  dispatch
}