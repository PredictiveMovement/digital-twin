const { shareReplay, share, merge, fromEvent, of } = require('rxjs')
const { mergeMap, filter, map } = require('rxjs/operators')

const { virtualTime, VirtualTime } = require('./lib/virtualTime')

const postombud = require('./streams/postombud')
const regions = require('./streams/regions')
const kommuner = require('./streams/kommuner')
const { safeId } = require('./lib/id')

const engine = {
  experiments: [],
  createExperiment: ({ id = safeId() } = {}) => {
    const experiment = {
      id,
      virtualTime, // TODO: move this from being a static property to being a property of the experiment
      cars: kommuner.pipe(mergeMap((kommun) => kommun.cars)),
      dispatchedBookings: kommuner.pipe(mergeMap((k) => k.dispatchedBookings)),
      buses: regions.pipe(mergeMap((region) => region.buses)),
      busStops: regions.pipe(mergeMap((region) => region.stops)),
      postombud,
      kommuner,
    }

    // Add these separate streams here so we don't have to register more than one event listener per booking and car
    experiment.bookingUpdates = experiment.dispatchedBookings.pipe(
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
    )

    experiment.carUpdates = merge(experiment.cars, experiment.buses).pipe(
      mergeMap((car) => fromEvent(car, 'moved')),
      share()
    )

    experiment.dispatchedBookings.subscribe((booking) =>
      info(`Booking ${booking?.id} dispatched to fleet ${booking?.fleet?.name}`)
    )
    engine.experiments.push(experiment)

    return experiment
  },
}

// TODO: see if we can remove this
process.setMaxListeners(0)

module.exports = engine
