const {
  from,
  filter,
  share,
  merge,
  fromEvent,
  of,
  concatMap,
  switchMap,
  shareReplay,
} = require('rxjs')
const { mergeMap, map, scan, catchError } = require('rxjs/operators')

const { virtualTime } = require('./lib/virtualTime')

const postombud = require('./streams/postombud')
const kommuner = require('./streams/kommuner')
const regions = require('./streams/regions')(kommuner)
const { safeId } = require('./lib/id')
const { readParameters } = require('./lib/fileUtils')
const statistics = require('./lib/statistics')
const { info, error } = require('./lib/log')

const static = {
  busStops: regions.pipe(mergeMap((region) => region.stops)),
  lineShapes: regions.pipe(mergeMap((region) => region.lineShapes)),
}

const engine = {
  experiments: [],
  createExperiment: ({ id = safeId() } = {}) => {
    const savedParams = readParameters()

    info('Starting experiment with params:', savedParams)

    const parameters = {
      id,
      startDate: new Date(),
      fixedRoute: savedParams.fixedRoute || 100,
    }
    statistics.collectExperimentMetadata(parameters)

    const experiment = {
      virtualTime, // TODO: move this from being a static property to being a property of the experiment
      cars: kommuner.pipe(mergeMap((kommun) => kommun.cars)),
      dispatchedBookings: merge(
        regions.pipe(mergeMap((r) => r.dispatchedBookings)),
        kommuner.pipe(mergeMap((k) => k.dispatchedBookings))
      ),
      buses: regions.pipe(mergeMap((region) => region.buses)),
      postombud,
      kommuner,
      parameters,
      passengers: regions.pipe(mergeMap((region) => region.citizens)),
      taxis: regions.pipe(mergeMap((region) => region.taxis)),
      ...static,
    }

    experiment.passengers
      .pipe(
        switchMap(({ bookings }) => bookings),
        mergeMap((booking) => booking.statusEvents),
        catchError((err) => error('passenger bookings err', err)),
        shareReplay()
      )
      .subscribe((booking) => {
        statistics.collectBooking(booking, parameters)
      })

    experiment.bookingUpdates = experiment.dispatchedBookings.pipe(
      mergeMap((booking) =>
        merge(
          booking.queuedEvents,
          booking.pickedUpEvents,
          booking.assignedEvents,
          booking.deliveredEvents
        )
      ),
      catchError((err) => error('booking updates err', err)),
      share()
    )
    experiment.passengerUpdates = experiment.passengers.pipe(
      mergeMap((passenger) =>
        merge(passenger.deliveredEvents, passenger.pickedUpEvents)
      ),
      catchError((err) => error('passenger updates err', err)),

      share()
    )

    // TODO: Rename to vehicleUpdates
    experiment.carUpdates = merge(
      experiment.cars,
      experiment.buses,
      experiment.taxis
    ).pipe(
      mergeMap((car) => car.movedEvents),
      catchError((err) => error('car updates err', err)),

      share()
    )

    experiment.dispatchedBookings.subscribe((booking) =>
      info(`Booking ${booking?.id} dispatched to car ${booking?.car?.id}`)
    )
    engine.experiments.push(experiment)

    return experiment
  },
}

// TODO: see if we can remove this
process.setMaxListeners(0)

module.exports = engine
