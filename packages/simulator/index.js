const { share, merge, switchMap, shareReplay } = require('rxjs')
const { mergeMap, map, scan, catchError } = require('rxjs/operators')

const { virtualTime } = require('./lib/virtualTime')

const kommuner = require('./streams/kommuner')
const regions = require('./streams/regions')(kommuner)
const { safeId } = require('./lib/id')
const { readParameters } = require('./lib/fileUtils')
const statistics = require('./lib/statistics')
const { info, error, debug } = require('./lib/log')

const static = {
  busStops: regions.pipe(mergeMap((region) => region.stops)),
  lineShapes: regions.pipe(mergeMap((region) => region.lineShapes)),
  postombud: kommuner.pipe(mergeMap((kommun) => kommun.postombud)),
  kommuner,
}

const engine = {
  createExperiment: ({ defaultEmitters, id = safeId() } = {}) => {
    const savedParams = readParameters()

    info('Starting experiment with params:', savedParams)

    const parameters = {
      id,
      startDate: new Date(),
      fixedRoute: savedParams.fixedRoute || 100,
      emitters: defaultEmitters,
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
      measureStations: kommuner.pipe(
        mergeMap((kommun) => kommun.measureStations)
      ),
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
        try {
          statistics.collectBooking(booking, parameters)
        } catch (err) {
          error('collectBooking err', err)
        }
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
    // experiment.passengerUpdates = experiment.passengers.pipe(
    //   mergeMap((passenger) =>
    //     merge(passenger.deliveredEvents, passenger.pickedUpEvents)
    //   ),
    //   catchError((err) => error('passenger updates err', err)),

    //   share()
    // )

    // TODO: Rename to vehicleUpdates
    experiment.carUpdates = merge(
      experiment.cars,
      experiment.taxis,
      experiment.buses
    ).pipe(
      mergeMap((car) => car.movedEvents),
      catchError((err) => error('car updates err', err)),

      share()
    )

    experiment.dispatchedBookings.subscribe((booking) =>
      debug(`Booking ${booking?.id} dispatched to car ${booking?.car?.id}`)
    )

    return experiment
  },
}

// TODO: see if we can remove this
process.setMaxListeners(0)

module.exports = engine
