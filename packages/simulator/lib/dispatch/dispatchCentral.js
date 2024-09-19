const { from } = require('rxjs')
const { filter, mergeMap } = require('rxjs/operators')

const handleBooking = (car) => (source) => {
  return source.pipe(
    filter((booking) => !car.queue.find((b) => b.id === booking.id)),
    filter((booking) => car.canHandleBooking(booking)),
    mergeMap((booking) => car.handleBooking(booking))
  )
}
const dispatch = (cars, bookings) => {
  return from(cars).pipe(
    mergeMap((car) =>
      from(bookings).pipe(
        handleBooking(car)
      )
    )
  )
}

module.exports = {
  dispatch,
}