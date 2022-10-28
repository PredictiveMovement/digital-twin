const { startWith, mergeMap, scan, map } = require('rxjs')

/**
 * When a new socket is connected, we send the current state of the experiment
 *
 * @param {experiment} experiment
 * @param {socket} socket
 * @returns an array of subscriptions
 */
const register = (experiment, socket) => {
  return [
    experiment.passengers
      .pipe(
        mergeMap((passenger) =>
          passenger.bookings.pipe(
            scan((acc, booking) => [...acc, booking.toObject()], []), // every booking is added to the array
            map((bookings) => ({ passenger, bookings })),
            startWith(
              { passenger, bookings: [] } // first value of passenger without any bookings
            )
          )
        )
      )
      .subscribe(({ passenger, bookings }) => {
        socket.emit('passenger', { ...passenger.toObject(), bookings })
      }),
    experiment.passengerUpdates.subscribe((passenger) =>
      socket.emit('passenger', passenger.toObject())
    ),
  ]
}

module.exports = {
  register,
}
