const { from } = require('rxjs')
const { tap, filter, mergeMap } = require('rxjs/operators')
const { info } = require('../log')

const dispatch = (cars, bookings) => {
  return cars.pipe(
    tap((car) => info(`🚛 Dispatching vehicle ${car.id}`)),
    mergeMap((car) =>
      from(bookings).pipe(
        filter((booking) => !car.queue.find((b) => b.id === booking.id)),
        filter((booking) => car.canHandleBooking(booking)),
        mergeMap((booking) => car.handleBooking(booking))
      )
    )
  )
}

module.exports = {
  dispatch,
}
