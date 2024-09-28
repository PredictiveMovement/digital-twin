const { from } = require('rxjs')
const { mergeMap, find, tap, filter } = require('rxjs/operators')
const { info } = require('../log')

const dispatch = (cars, bookings) => {
  return from(bookings).pipe(
    filter((booking) => booking.carId),
    mergeMap((booking) =>
      cars.pipe(
        tap((car) => info(`🚗 Finding car for ${booking.carId} === ${car.id}`)),
        find((car) => car.id === booking.carId),
        filter(Boolean),
        tap((car) => info(`🎯 Dispatching ${booking.id} to ${car.id}`)),
        mergeMap((car) => car.handleBooking(booking))
      )
    )
  )
}

module.exports = {
  dispatch,
}
