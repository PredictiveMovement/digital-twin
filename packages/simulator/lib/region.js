const { from, shareReplay, Subject, ReplaySubject, mergeMap } = require('rxjs')
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

    // this.buses = new ReplaySubject()
    this.taxis = new ReplaySubject()
    this.buses = populateBusesStream(kommuner)

    const busStartPositions = stopTimes.pipe(
      groupBy(({ tripId }) => tripId),
      mergeMap((stopTimesPerRoute) =>
        stopTimesPerRoute.pipe(
          first(),
          mergeMap((first) =>
            stopTimesPerRoute.pipe(last(), take(1), startWith(first))
          ),
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
      ),
      shareReplay()
    )

    busStartPositions
      .pipe(
        groupBy(({ kommun }) => kommun),
        map((busStartPositionsPerKommun) => ({
          buses: this.buses.pipe(
            filter((bus) => bus.kommun === busStartPositionsPerKommun.key)
          ),
          stops: busStartPositionsPerKommun,
        }))
      )
      .subscribe(async ({ buses, stops }) => {
        busDispatch(buses, stops).subscribe((resultBuses) =>
          resultBuses.map(({ bus, steps }) => {
            pairwise(steps).map(
              ([
                {
                  arrival: pickupDepartureTime,
                  location: [pickupLon, pickupLat],
                },
                {
                  arrival: destinationDepartureTime,
                  location: [destinationLon, destinationLat],
                },
              ]) => {
                return bus.handleBooking(
                  new Booking({
                    pickup: {
                      departureTime: pickupDepartureTime,
                      position: {
                        lon: pickupLon,
                        lat: pickupLat,
                      },
                    },
                    destination: {
                      departureTime: destinationDepartureTime,
                      position: {
                        lon: destinationLon,
                        lat: destinationLat,
                      },
                    },
                  })
                )
              }
            )
          })
        )
      })

    taxiDispatch(this.taxis, passengers).subscribe((e) => {
      e.map(({ taxi, steps }) => steps.map((step) => taxi.addInstruction(step)))
    })
  }
}

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
