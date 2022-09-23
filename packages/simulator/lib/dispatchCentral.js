const { timer } = require('rxjs')
const { toArray, map, filter, takeUntil, mergeMap } = require('rxjs/operators')
const { haversine } = require('./distance')

const dispatch = (cars, bookings) => {
  return bookings.pipe(
    mergeMap(
      (booking) =>
        cars.pipe(
          map((car) => ({
            car,
            distance: haversine(
              car.heading || car.position,
              booking.pickup.position
            ),
          })),
          filter(({ car }) => car.canPickupBooking(booking)), // wait until we have a car with free capacity
          takeUntil(timer(300)), // to be able to sort we have to batch somehow. Lets start with time
          toArray(),
          filter((c) => c.length),
          map(
            (cars) => cars.sort((a, b) => a.distance - b.distance).shift()?.car
          ),
          filter((car) => car),
          map((car) => ({ car, booking: car.handleBooking(booking) }))
        ),
      1
    )
  )
}

module.exports = {
  dispatch,
}
