const postombud = require('../streams/postombud')
const { shareReplay, mergeMap, share, map } = require('rxjs/operators')
const { getBookings } = require('./booking')
function getEngine(engine) {
  engine.kommuner.pipe(map(getBookings), shareReplay())

  const parcelDeliveriesEngine = {
    //Add these separate streams here so we don't have to register more than one event listener per booking and car
    bookingUpdates: engine.dispatchedBookings.pipe(
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

  engine.dispatchedBookings.subscribe((booking) =>
    info(`Booking ${booking?.id} dispatched to fleet ${booking?.fleet?.name}`)
  )

  return parcelDeliveriesEngine
}

module.exports = {
  getEngine,
}
