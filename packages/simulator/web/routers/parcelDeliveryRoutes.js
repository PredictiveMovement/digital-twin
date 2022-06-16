const { toArray, bufferTime, map } = require('rxjs/operators')
function register(parcelDeliveryEngine, socket) {
  parcelDeliveryEngine.postombud.pipe(toArray()).subscribe((postombud) => {
    socket.emit('postombud', postombud)
  })

  parcelDeliveryEngine.bookingUpdates
    .pipe(cleanBookings(), bufferTime(100, null, 1000))
    .subscribe((bookings) => {
      if (bookings.length) {
        io.emit('bookings', bookings)
      }
    })
}

const cleanBookings = () => (bookings) =>
  bookings.pipe(
    map(
      ({
        pickup: { position: pickup },
        destination: { position: destination, name },
        id,
        status,
        isCommercial,
        co2,
        cost,
        deliveryTime,
        car,
      }) => ({
        id,
        pickup,
        destination,
        name,
        status,
        isCommercial,
        deliveryTime,
        co2,
        cost,
        carId: car?.id,
      })
    )
  )

module.exports = {
  register,
}
