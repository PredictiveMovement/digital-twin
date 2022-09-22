const {
  from,
  filter,
  share,
  merge,
  fromEvent,
  of,
  concatMap,
  shareReplay,
} = require('rxjs')
const { mergeMap, map, scan } = require('rxjs/operators')

const { virtualTime } = require('./lib/virtualTime')

const postombud = require('./streams/postombud')
const kommuner = require('./streams/kommuner')
const regions = require('./streams/regions')(kommuner)
const { safeId } = require('./lib/id')
const { readParameters } = require('./lib/fileUtils')
const statistics = require('./lib/statistics')
const { info } = require('./lib/log')

const static = {
  busStops: regions.pipe(mergeMap((region) => region.stops)),
  lineShapes: regions.pipe(mergeMap((region) => region.lineShapes)),
}

const engine = {
  experiments: [],
  createExperiment: ({ id = safeId() } = {}) => {
    const savedParams = readParameters()

    info('Starting experiment with params:', savedParams)
    regions
      .pipe(
        map((region) => {
          region.distributeInstructions()
        })
      )
      .subscribe(() => null)

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
      busStops: regions.pipe(mergeMap((region) => region.stops)),
      lineShapes: regions.pipe(mergeMap((region) => region.lineShapes)),
      postombud,
      kommuner,
      parameters,
      passengers: regions.pipe(mergeMap((region) => region.passengers)),
      taxis: regions.pipe(mergeMap((region) => region.taxis)),
    }

    experiment.passengers
      .pipe(
        switchMap(({ bookings }) => bookings),
        mergeMap((booking) => booking.statusEvents),
        shareReplay()
      )
      .subscribe((booking) => {
        statistics.collectBooking({
          experimentSettings: parameters,
          ...booking,
        })
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
      share()
    )
    experiment.passengerUpdates = experiment.passengers.pipe(
      mergeMap((passenger) =>
        merge(passenger.deliveredEvents, passenger.pickedUpEvents)
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
      console.log(
        `Booking ${booking?.id} dispatched to fleet ${booking?.fleet?.name}`
      )
    )
    engine.experiments.push(experiment)

    return experiment
  },
}

// TODO: see if we can remove this
process.setMaxListeners(0)

module.exports = engine
