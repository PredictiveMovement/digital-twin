const { getBookings } = require('./simulator/bookings')
const postombud = require('./streams/postombud')
function getParcelEngine() {
  kommuner.pipe(map(getBookings), shareReplay())

  const parcelDeliveriesEngine = {
    cars: kommuner.pipe(
      mergeMap((kommun) => kommun.cars),
      shareReplay()
    ),
    //Add these separate streams here so we don't have to register more than one event listener per booking and car
    carUpdates: parcelDeliveriesEngine.cars.pipe(
      mergeMap((car) => fromEvent(car, 'moved')),
      // tap((car) => console.log(`*** ${car.id}: moved`)),
      share()
    ),
    bookingUpdates: parcelDeliveriesEngine.dispatchedBookings.pipe(
      mergeMap((booking) =>
        merge(
          of(booking),
          fromEvent(booking, 'queued'),
          fromEvent(booking, 'pickedup'),
          fromEvent(booking, 'assigned'),
          fromEvent(booking, 'delivered')
        )
      ),
      share()
    ),
    postombud,
  }

  parcelDeliveriesEngine.dispatchedBookings.subscribe((booking) =>
    info(`Booking ${booking?.id} dispatched to fleet ${booking?.fleet?.name}`)
  )
  return parcelDeliveriesEngine
}
