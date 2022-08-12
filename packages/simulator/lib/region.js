const {
  pipe,
  from,
  shareReplay,
  Subject,
  ReplaySubject,
  mergeMap,
} = require('rxjs')
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

const populateBusesStream = (kommuner) => {
  const buses = new ReplaySubject()
  kommuner
    .pipe(
      mergeMap(({ name, busCount }) =>
        Pelias.search(name)
          .then((res) => res.position)
          .then((position) => {
            Array.from({ length: busCount }, () =>
              buses.next(createBus({ position, kommun: name }, from([])))
            )
          })
      )
    )
    .toPromise()
    .then((_) => buses.complete())
  return buses
}

const mergeFirstAndLastStopInTripWithKommunName = (kommuner) =>
  pipe(
    mergeMap((stopTimesPerRoute) =>
      stopTimesPerRoute.pipe(
        first(),
        mergeMap((first) => stopTimesPerRoute.pipe(last(), startWith(first))),
        toArray()
      )
    ),
    mergeMap(([firstStop, lastStop]) =>
      kommuner.pipe(
        first(
          (kommun) =>
            isInsideCoordinates(
              firstStop.position,
              kommun.geometry.coordinates
            ),
          null
        ),
        filter((e) => e),
        map(({ name }) => ({
          first: firstStop,
          last: lastStop,
          kommun: name,
        }))
      )
    )
  )
const filterBusesInKommun = (bus, kommun) => bus.kommun === kommun
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

    this.taxis = new ReplaySubject()
    this.buses = populateBusesStream(kommuner)

    stopTimes
      .pipe(
        groupBy(({ tripId }) => tripId),
        mergeFirstAndLastStopInTripWithKommunName(kommuner),
        groupBy(({ kommun }) => kommun),
        map((firstLastStop) => {
          const kommunName = firstLastStop.key
          return {
            buses: this.buses.pipe(filter((bus) => bus.kommun === kommunName)),
            stops: firstLastStop,
          }
        })
      )
      .subscribe(({ buses, stops }) =>
        busDispatch(buses, stops).subscribe((resultBuses) =>
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
const stepsToBooking = ([first, last]) =>
  new Booking({
    pickup: stepToBookingEntity(first),
    destination: stepToBookingEntity(last),
  })

const stepToBookingEntity = ({
  arrival: departureTime,
  location: [lon, lat],
}) => ({
  departureTime,
  position: { lat, lon },
})

const pairwise = (arr) =>
  arr
    .reduce((acc, curr, i) => {
      // Pairwise
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
