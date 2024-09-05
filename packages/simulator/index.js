const { filter, share, merge, shareReplay } = require('rxjs')
const {
  mergeMap,
  map,
  catchError,
  toArray,
  pairwise,
} = require('rxjs/operators')

const { virtualTime } = require('./lib/virtualTime')
const { safeId } = require('./lib/id')
const { read } = require('./config')
const statistics = require('./lib/statistics')
const { info, error, logStream } = require('./lib/log')
const { haversine, getNrOfPointsBetween } = require('./lib/distance')

const engine = {
  subscriptions: [],
  createExperiment: ({ defaultEmitters, id = safeId() } = {}) => {
    const savedParams = read()
    info(`*** Starting experiment ${id} with params:`, {
      id: savedParams.id,
      fixedRoute: savedParams.fixedRoute,
      emitters: savedParams.emitters,
      municipalities: Object.keys(savedParams.fleets).map((municipality) => {
        return `${municipality} (${savedParams.fleets[municipality].fleets.length} fleets)`
      }),
    })

    const regions = require('./streams/regions')(savedParams)

    const parameters = {
      id,
      startDate: new Date(),
      fixedRoute: savedParams.fixedRoute || 100,
      emitters: defaultEmitters,
      fleets: savedParams.fleets,
    }
    statistics.collectExperimentMetadata(parameters)
    console.log('parameters', parameters)
    console.log('regions', regions)
    console.log('HELLO THERE')
    const experiment = {
      logStream,
      busStops: regions.pipe(
        filter((region) => region.stops),
        mergeMap((region) => region.stops),
        shareReplay()
      ),
      lineShapes: regions.pipe(
        filter((region) => region.lineShapes),
        mergeMap((region) => region.lineShapes),
        shareReplay()
      ),
      postombud: regions.pipe(mergeMap((region) => region.postombud)),
      kommuner: regions.pipe(
        mergeMap((region) => region.kommuner),
        shareReplay()
      ),
      subscriptions: [],
      virtualTime,
      cars: regions.pipe(mergeMap((region) => region.cars)),
      dispatchedBookings: merge(
        regions.pipe(mergeMap((region) => region.dispatchedBookings)),
        regions.pipe(
          mergeMap((region) =>
            region.kommuner.pipe(
              mergeMap((kommun) => kommun.dispatchedBookings)
            )
          )
        )
      ),
      buses: regions.pipe(mergeMap((region) => region.buses)),
      parameters,
      passengers: regions.pipe(
        filter((region) => region.citizens),
        mergeMap((region) => region.citizens),
        catchError((err) => error('Experiment -> Passengers', err)),
        shareReplay()
      ),
      taxis: regions.pipe(mergeMap((region) => region.taxis)),

      // Adding garbage collection points
      garbageCollectionPoints: regions.pipe(
        mergeMap((region) => region.garbageCollectionPoints)
      ),
      /*garbageCollectionUpdates: regions.pipe(
        mergeMap((region) => region.garbageCollectionUpdates),
        share()
      ),*/
    }
    experiment.passengers
      .pipe(
        mergeMap((passenger) => passenger.bookings),
        catchError((err) => error('passenger statistics err', err)),
        shareReplay()
      )
      // TODO:take care of this subscription so we know how to unsubscribe
      .subscribe((booking) => {
        try {
          statistics.collectBooking(booking, parameters)
        } catch (err) {
          error('collectBooking err', err)
        }
      })

    experiment.bookingUpdates = experiment.dispatchedBookings.pipe(
      mergeMap((booking) => booking.statusEvents),
      catchError((err) => error('bookingUpdates', err)),
      share()
    )

    experiment.passengerUpdates = experiment.passengers.pipe(
      mergeMap(({ deliveredEvents, pickedUpEvents }) =>
        merge(deliveredEvents, pickedUpEvents)
      ),
      catchError((err) => error('passengerUpdates', err)),
      share()
    )

    // TODO: Rename to vehicleUpdates
    experiment.carUpdates = merge(
      experiment.buses,
      experiment.cars,
      experiment.taxis
    ).pipe(
      mergeMap((car) => car.movedEvents),
      catchError((err) => error('car updates err', err)),

      share()
    )

    return experiment
  },
}

module.exports = engine
