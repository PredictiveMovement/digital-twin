const { filter, share, merge, shareReplay } = require('rxjs')
const {
  mergeMap,
  map,
  tap,
  scan,
  catchError,
  distinctUntilChanged,
  toArray,
  pairwise,
} = require('rxjs/operators')

const { virtualTime } = require('./lib/virtualTime')

const kommuner = require('./streams/kommuner')
const regions = require('./streams/regions')(kommuner)
const { safeId } = require('./lib/id')
const { readParameters } = require('./lib/fileUtils')
const statistics = require('./lib/statistics')
const { info, error, debug } = require('./lib/log')
const { haversine, getNrOfPointsBetween } = require('./lib/distance')

const static = {
  busStops: regions.pipe(mergeMap((region) => region.stops)),
  lineShapes: regions.pipe(
    mergeMap((region) => region.lineShapes),
    shareReplay()
  ),
  postombud: kommuner.pipe(mergeMap((kommun) => kommun.postombud)),
  kommuner: kommuner.pipe(shareReplay()),
}

const engine = {
  subscriptions: [],
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
      ...static,
      subscriptions: [],
      virtualTime,
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
      passengers: regions.pipe(
        mergeMap((region) => region.citizens),
        shareReplay()
      ),
      taxis: regions.pipe(mergeMap((region) => region.taxis)),
    }
    experiment.passengers
      .pipe(
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
      experiment.cars,
      experiment.taxis,
      experiment.buses
    ).pipe(
      mergeMap((car) => car.movedEvents),
      catchError((err) => error('car updates err', err)),

      share()
    )

    experiment.measureStationUpdates = experiment.cars.pipe(
      filter((car) => car.vehicleType === 'car'),
      filter((car) => !car.isPrivateCar),
      mergeMap(({ id, movedEvents }) =>
        movedEvents.pipe(
          mergeMap(({ position: carPosition, pointsPassedSinceLastUpdate }) =>
            experiment.measureStations.pipe(
              map(({ position: mPosition, id: mId }) => ({
                carPosition: carPosition.toObject(),
                pointsPassedSinceLastUpdate,
                mPosition,
                id,
                mId,
              })),
              filter(
                ({
                  carPosition,
                  mPosition,
                  pointsPassedSinceLastUpdate = [],
                }) =>
                  [...pointsPassedSinceLastUpdate, { position: carPosition }]
                    .map(({ position, meters }, index, arr) => {
                      if (arr.length > index + 1) {
                        return {
                          p1: position,
                          p2: arr[index + 1].position,
                          meters,
                        }
                      }
                      return null
                    })
                    .filter((e) => !!e)
                    .flatMap(({ p1, p2, meters }) =>
                      getNrOfPointsBetween(p1, p2, Math.round(meters / 2))
                    )
                    .filter((e) => e.lat && e.lon)
                    .some((position) => haversine(position, mPosition) < 10)
              ),
              toArray()
            )
          ),
          pairwise(),
          filter(([prev, curr]) => prev.length || curr.length),
          map(([previousStations, currentStations]) =>
            previousStations.filter(
              (p) => !currentStations.some(({ mId }) => p.mId === mId)
            )
          ),
          filter((e) => e.length)
        )
      ),
      map((events) =>
        events.map(({ id: carId, mId: stationId }) => ({ carId, stationId }))
      )
    )

    experiment.dispatchedBookings.subscribe((booking) =>
      debug(`Booking ${booking?.id} dispatched to car ${booking?.car?.id}`)
    )

    return experiment
  },
}

module.exports = engine
