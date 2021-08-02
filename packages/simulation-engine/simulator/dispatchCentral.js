const { from } = require('rxjs')
const { toArray, map } = require('rxjs/operators')
const { haversine } = require('../lib/distance')

const dispatch = (cars, bookings) => {
  bookings.subscribe((booking) =>
    from(cars).pipe(
      map((car) => ({car, distance: haversine(car.position, booking.pickup.position)})), 
      toArray(),
      map((cars) => cars.sort((a, b) => haversine(a.distance, b.distance))), 
      // naive dispatch, just pick the first car that is closest to the pickup
      map(car => car.pickup(booking))
    )
  )
}

module.exports = {
  dispatch
}