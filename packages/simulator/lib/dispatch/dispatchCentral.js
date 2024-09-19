const { from } = require('rxjs')
const { filter, mergeMap } = require('rxjs/operators')

const filterUniqueBooking = (car) => (source) => {
  return source.pipe(
    filter((booking) => !car.queue.find((b) => b.id === booking.id))
  )
}

const filterCanHandleBooking = (car) => (source) => {
  return source.pipe(filter((booking) => car.canHandleBooking(booking)))
}

const processBooking = (car) => (source) => {
  return source.pipe(mergeMap((booking) => car.handleBooking(booking)))
}

const dispatch = (cars, bookings) => {
  return from(cars).pipe(
    mergeMap((car) =>
      from(bookings).pipe(
        filterUniqueBooking(car),
        filterCanHandleBooking(car),
        processBooking(car)
      )
    )
  )
}

module.exports = {
  dispatch,
}
