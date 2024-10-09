const { pipe, map, bufferTime, filter } = require('rxjs')

const cleanBookings = () =>
  // TODO: Replace cleanBookings with .toObject() on Booking
  pipe(
    map(
      ({
        pickup,
        destination,
        assigned,
        id,
        status,
        isCommercial,
        co2,
        cost,
        deliveryTime,
        pickupDateTime,
        car,
        type,
        recyclingType,
      }) => ({
        id,
        pickup: pickup.position,
        assigned,
        destination: destination.position,
        status,
        isCommercial,
        deliveryTime,
        pickupDateTime,
        co2,
        cost,
        carId: car?.id,
        type,
        recyclingType,
      })
    )
  )

const register = (experiment, socket) => {
  return [
    experiment.dispatchedBookings
      .pipe(
        cleanBookings(),
        bufferTime(100, null, 1000),
        filter((e) => e.length)
      )
      .subscribe((bookings) => {
        socket.emit('bookings', bookings)
      }),

    experiment.bookingUpdates
      .pipe(
        cleanBookings(),
        bufferTime(100, null, 1000),
        filter((e) => e.length)
      )
      .subscribe((bookings) => {
        socket.emit('bookings', bookings)
      }),
  ]
}

module.exports = {
  register,
}
