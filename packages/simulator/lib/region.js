const {
  pipe,
  from,
  shareReplay,
  Subject,
  ReplaySubject,
  mergeMap,
} = require('rxjs')
const moment = require('moment')
const {
  map,
  merge,
  last,
  first,
  concat,
  groupBy,
  startWith,
  tap,
  toArray,
  find,
  take,
  count,
  filter,
  switchMap,
  bufferCount,
} = require('rxjs/operators')
const Bus = require('./vehicles/bus')
const Booking = require('./models/booking')
const { safeId } = require('./id')
const { busDispatch } = require('./busDispatch')
const { taxiDispatch } = require('./taxiDispatch')
const Pelias = require('./pelias')
const Taxi = require('./vehicles/taxi')
const { isInsideCoordinates } = require('../lib/polygon')
const dynamicRatio = 0.5

const populateTaxisBusesStreams = (kommuner) => {
  const buses = new ReplaySubject()
  const taxis = new ReplaySubject()
  kommuner
    .pipe(
      mergeMap(({ name, busCount }) =>
        Pelias.search(name)
          .then((res) => res.position)
          .then((position) => {
            const nrOfTaxis = Math.floor(dynamicRatio * busCount)
            const nrOfBuses = busCount - nrOfTaxis
            Array.from({ length: nrOfBuses }, () =>
              buses.next(createBus({ position, kommun: name }, from([])))
            )
            Array.from({ length: nrOfTaxis }, () =>
              taxis.next(createTaxi({ position }, from([])))
            )
          })
      )
    )
    .toPromise()
    .then((_) => {
      buses.complete()
      taxis.complete()
    })
  return { buses, taxis }
}

const groupStopsByKommun = (kommuner) =>
  pipe(
    mergeMap((stopsInTrip) => {
      const s = stopsInTrip.pipe(shareReplay())
      return s.pipe(
        first(),
        mergeMap((firstStop) =>
          kommuner.pipe(
            filter(({ geometry }) =>
              isInsideCoordinates(firstStop.position, geometry.coordinates)
            ),
            map(({ name }) => ({
              stops: s.pipe(tap()),
              kommun: name,
            }))
          )
        )
      )
    }),
    groupBy(({ kommun }) => kommun)
  )

class Region {
  constructor({
    geometry,
    name,
    id,
    stops,
    stopTimes,
    lineShapes,
    passengers,
    kommuner,
  }) {
    this.geometry = geometry
    this.name = name
    this.id = id
    this.unhandledBookings = new Subject()
    this.stops = stops
    this.passengers = passengers.pipe(shareReplay())
    this.lineShapes = lineShapes

    const { buses, taxis } = populateTaxisBusesStreams(kommuner)

    this.taxis = taxis
    this.buses = buses

    stopTimes
      .pipe(
        groupBy(({ tripId }) => tripId),
        groupStopsByKommun(kommuner),
        map((stopsTimes) => {
          const kommunName = stopsTimes.key
          return {
            buses: this.buses.pipe(filter((bus) => bus.kommun === kommunName)),
            firstLastStop: stopsTimes.pipe(
              mergeMap(({ stops }) => stops.pipe(toArray()))
            ),
          }
        })
      )
      .subscribe(({ buses, firstLastStop }) =>
        busDispatch(buses, firstLastStop).subscribe((resultBuses) =>
          resultBuses.map(({ bus, steps }) =>
            pairwise(steps)
              .map(stepsToBooking)
              .map((booking) => bus.handleBooking(booking))
          )
        )
      )

    taxiDispatch(this.taxis, passengers).subscribe((e) => {
      e.map(({ taxi, steps }) => steps.map((step) => taxi.addInstruction(step)))
    })
  }
}
const stepsToBooking = ([pickup, dropoff]) =>
  new Booking({
    pickup: pickup,
    destination: dropoff,
    lineNumber: pickup.lineNumber ? pickup.lineNumber : dropoff.lineNumber,
  })

const pairwise = (arr) =>
  arr
    .reduce((acc, curr, i) => {
      if (i === 0) {
        acc[i] = [curr]
        return acc
      } else {
        const prevPair = acc[i - 1]
        const prevValue = prevPair[prevPair.length - 1]
        acc[i] = [prevValue, curr]
        return acc
      }
    }, [])
    .filter((e) => e.length == 2)

const createTaxi = ({ position }) => new Taxi({ id: safeId(), position })

const createBus = (
  { tripId, finalStop, lineNumber, position, kommun },
  stops
) =>
  new Bus({
    id: tripId,
    finalStop,
    lineNumber,
    position,
    stops,
    heading: position,
    kommun,
  })

module.exports = Region
