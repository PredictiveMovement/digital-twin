const { mergeAll, timer, of } = require('rxjs')
const {
  toArray,
  map,
  tap,
  filter,
  takeUntil,
  delay,
  mergeMap,
  catchError,
} = require('rxjs/operators')
const { haversine } = require('./distance')

const dispatch = (cars, bookings) => {
  return bookings.pipe(
    tap((booking) => {
      //console.log(`*** new booking ${booking.id}. Looking for a car nearby...`)
    }),
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
          // tap(cars => cars.length ? null : console.log(`*** available cars to choose from: ${cars.length}`)),
          // naive dispatch, just pick the first car that is closest to the pickup
          map(
            (cars) => cars.sort((a, b) => a.distance - b.distance).shift()?.car
          ),
          filter((car) => car),
          map((car) => ({ car, booking: car.handleBooking(booking) })),
          tap(({ car, booking }) =>
            console.log(
              `*** booking ${booking.id} dispatched to car #${car.id} in fleet ${car.fleet.name} ${booking.kommun.name}`
            )
          )
        ),
      1
    )
    // mergeAll()
  )
}

module.exports = {
  dispatch,
}
