const {
  from,
  filter,
  share,
  tap,
  merge,
  fromEvent,
  of,
  concatMap,
  shareReplay,
} = require('rxjs')
const { mergeMap } = require('rxjs/operators')

const { virtualTime } = require('./lib/virtualTime')

const postombud = require('./streams/postombud')
const kommuner = require('./streams/kommuner')
const regions = require('./streams/regions')(kommuner)
const { safeId } = require('./lib/id')
const { readParameters } = require('./lib/fileUtils')
const statistics = require('./lib/statistics')

const static = {
  busStops: regions.pipe(mergeMap((region) => region.stops)),
  lineShapes: regions.pipe(mergeMap((region) => region.lineShapes)),
}

const engine = {
  experiments: [],
  createExperiment: ({ id = safeId() } = {}) => {
    const savedParams = readParameters()
    console.log('Starting experiment with params:', savedParams)

    const parameters = {
      id,
      startDate: new Date(),
      fixedRoute: savedParams.fixedRoute || 100,
    }
    statistics.collectExperimentMetadata(parameters)

    const experiment = Object.assign(
      {
        virtualTime, // TODO: move this from being a static property to being a property of the experiment
        cars: kommuner.pipe(mergeMap((kommun) => kommun.cars)),
        dispatchedBookings: kommuner.pipe(
          mergeMap((k) => k.dispatchedBookings)
        ),
        buses: regions.pipe(mergeMap((region) => region.buses)),
        postombud,
        kommuner,
        parameters,
        passengers: regions.pipe(mergeMap((region) => region.passengers)),
        taxis: regions.pipe(mergeMap((region) => region.taxis)),
      },
      static
    )

    experiment.passengers
      .pipe(
        mergeMap((passenger) => passenger),
        concatMap(({ journeys }) => from(journeys)),
        mergeMap((journey) => fromEvent(journey, 'status')),
        shareReplay()
      )
      .subscribe((journey) => {
        delete journey.passenger.journeys // Avoid circular reference in serialization
        statistics.collectJourney({
          experimentSettings: parameters,
          ...journey,
        })
      })

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
    experiment.passengerUpdates = experiment.passengers.pipe(
      mergeMap((passenger) =>
        merge(
          of(passenger),
          // fromEvent(passenger, 'moved'), // TODO: If we want this performance will suffer!
          fromEvent(passenger, 'pickedup'),
          fromEvent(passenger, 'delivered')
        )
      ),
      share()
    )

    // TODO: Rename to vehicleUpdates
    experiment.carUpdates = merge(
      experiment.cars,
      experiment.buses,
      experiment.taxis
    ).pipe(
      mergeMap((car) => car.movedEvents),
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
