const {
  from,
  filter,
  share,
  merge,
  fromEvent,
  of,
  tap,
  concatMap,
  take,
  switchMap,
  shareReplay,
} = require('rxjs')
const {
  mergeMap,
  map,
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
const { haversine } = require('./lib/distance')

const static = {
  busStops: regions.pipe(mergeMap((region) => region.stops)),
  lineShapes: regions.pipe(mergeMap((region) => region.lineShapes)),
}

const engine = {
  experiments: [],
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
      postombud: kommuner.pipe(mergeMap((kommun) => kommun.postombud)),
      measureStations: kommuner.pipe(
        mergeMap((kommun) => kommun.measureStations)
      ),
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
    experiment.carUpdates = merge(experiment.cars, experiment.buses).pipe(
      mergeMap((car) => car.movedEvents),
      catchError((err) => error('car updates err', err)),

      share()
    )

    experiment.measureStationUpdates = experiment.cars.pipe(
      filter((car) => car.vehicleType === 'car'),
      filter((car) => !car.isPrivateCar),
      mergeMap(({ id, movedEvents }) =>
        movedEvents.pipe(
          mergeMap(({ position: carPosition }) =>
            experiment.measureStations.pipe(
              map(({ position: mPosition, id: mId }) => ({
                carPosition: carPosition.toObject(),
                mPosition,
                id,
                mId,
              })),
              filter(
                ({ carPosition, mPosition }) =>
                  haversine(carPosition, mPosition) < 1000
              ),
              toArray(),
              filter((e) => e.length)
            )
          ),
          tap((e) => null),
          distinctUntilChanged(),
          tap((e) => null),
          pairwise(),
          map(([previousStations, currentStations]) =>
            previousStations.filter(
              (p) => !currentStations.some(({ mId }) => p.mId === mId)
            )
          )
        )
      ),
      tap((events) => console.log('Events!', events)),
      map((events) =>
        events.map(({ id: carId, mId: stationId }) => ({ carId, stationId }))
      )
    )
    // previousStations:
    // [
    // {
    // carPosition: Position { lon: 12.77932048, lat: 56.01714356 },
    // mPosition: { lat: 56.01811632664044, lon: 12.766229298474165 },
    // id: 'v-k4RU-aySd',
    // mId: 19101
    // },
    // {
    // carPosition: Position { lon: 12.77932048, lat: 56.01714356 },
    // mPosition: { lat: 56.01830515683855, lon: 12.766234440035447 },
    // id: 'v-k4RU-aySd',
    // mId: 19102
    // }
    // ]
    //
    //
    //
    // currentStations:
    // [
    // {
    // carPosition: Position { lon: 12.77932048, lat: 56.01714356 },
    // mPosition: { lat: 56.01830515683855, lon: 12.766234440035447 },
    // id: 'v-k4RU-aySd',
    // mId: 19102
    // }
    // ]
    experiment.measureStationUpdates.subscribe(console.log)

    experiment.dispatchedBookings.subscribe((booking) =>
      debug(`Booking ${booking?.id} dispatched to car ${booking?.car?.id}`)
    )
    engine.experiments.push(experiment)

    return experiment
  },
}

// TODO: see if we can remove this
process.setMaxListeners(0)

module.exports = engine
