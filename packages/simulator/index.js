const { share, merge, fromEvent, of } = require('rxjs')
const { mergeMap } = require('rxjs/operators')

const { virtualTime } = require('./lib/virtualTime')

const postombud = require('./streams/postombud')
const regions = require('./streams/regions')
const kommuner = require('./streams/kommuner')
const { safeId } = require('./lib/id')
const { readParameters } = require('./lib/fileUtils')

const engine = {
  experiments: [],
  createExperiment: ({ id = safeId() } = {}) => {
    const savedParams = readParameters()
    console.log('Starting experiment with params:', savedParams)

    const parameters = {
      personalCars: savedParams.personalCars || true,
      taxis: savedParams.taxis || true,
      fixedRoute: savedParams.fixedRoute || 100,
    }

    const experiment = {
      id,
      virtualTime, // TODO: move this from being a static property to being a property of the experiment
      cars: kommuner.pipe(mergeMap((kommun) => kommun.cars)),
      dispatchedBookings: kommuner.pipe(mergeMap((k) => k.dispatchedBookings)),
      buses: regions.pipe(mergeMap((region) => region.buses)),
      busStops: regions.pipe(mergeMap((region) => region.stops)),
      postombud,
      kommuner,
      parameters,
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
