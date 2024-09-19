const { from, EMPTY } = require('rxjs')
const { tap, filter, mergeMap, catchError, map } = require('rxjs/operators')
const { info, error, warn, debug } = require('../log')

const dispatch = (cars, bookings) => {
  return cars.pipe(
    tap((car) => info(`🚚 Dispatching vehicle ${car.id}`)),
    mergeMap((car) =>
      from(bookings).pipe(
        filter((booking) => !car.queue.find((b) => b.id === booking.id)),
        filter((booking) => car.canHandleBooking(booking)),
        mergeMap((booking) => car.handleBooking(booking))
      )
    ),
  )
}

module.exports = {
  dispatch,
}