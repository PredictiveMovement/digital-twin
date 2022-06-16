const { shareReplay, from, fromEvent } = require('rxjs')
const { map, mergeMap, filter, share } = require('rxjs/operators')

const { virtualTime } = require('./lib/virtualTime')

const { stops } = require('./streams/publicTransport')

const kommuner = require('./streams/kommuner')

const engine = {
  virtualTime,
  dispatchedBookings: kommuner.pipe(
    mergeMap((kommun) => kommun.dispatchedBookings),
    shareReplay()
  ),
  busStopTimes: kommuner.pipe(
    mergeMap((kommun) =>
      kommun.buses.pipe(
        mergeMap((bus) =>
          from(bus.queue).pipe(
            map(({ pickup, destination }) => ({ pickup, destination }))
          )
        )
      )
    ),
    shareReplay()
  ),
  carUpdates: kommuner.pipe(
    mergeMap((kommun) => kommun.cars),
    shareReplay(),
    mergeMap((car) => fromEvent(car, 'moved')),
    // tap((car) => console.log(`*** ${car.id}: moved`)),
    share()
  ),
  busStops: stops.pipe(filter((stop) => !stop.station)),
  kommuner,
}

//TODO: see if we can remove this
process.setMaxListeners(0)

module.exports = engine
