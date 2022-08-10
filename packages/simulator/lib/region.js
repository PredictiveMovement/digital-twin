const { from, shareReplay, Subject, ReplaySubject, mergeMap } = require('rxjs')
const {
  map,
  first,
  groupBy,
  tap,
  toArray,
  find,
  take,
  count,
  filter,
  bufferCount,
} = require('rxjs/operators')
const Bus = require('./vehicles/bus')
const { safeId } = require('./id')
const { busDispatch } = require('./busDispatch')
const { taxiDispatch } = require('./taxiDispatch')
const Pelias = require('./pelias')
const Taxi = require('./vehicles/taxi')
const { isInsideCoordinates } = require('../lib/polygon')

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
    this.buses = new ReplaySubject()
    kommuner
      .pipe(
        mergeMap(async ({ name, busCount }) => {
          await Pelias.search(name)
            .then((res) => res.position)
            .then((position) =>
              Array.from({ length: busCount }, () =>
                this.buses.next(createBus({ position, kommun: name }, from([])))
              )
            )
        })
      )
      .subscribe((_) => null)

    const busStartPositions = stopTimes.pipe(
      tap(),
      groupBy(({ tripId }) => tripId),
      mergeMap((stopTimesPerRoute) => {
        return stopTimesPerRoute.pipe(first())
      }),
      mergeMap((stop) =>
        kommuner.pipe(
          first((kommun) =>
            isInsideCoordinates(stop.position, kommun.geometry.coordinates)
          ),
          map(({ name }) => ({
            ...stop,
            kommun: name,
          }))
        )
      ),
      shareReplay()
    )

    busStartPositions
      .pipe(
        groupBy(({ kommun }) => kommun),
        mergeMap((busStartPositionsPerKommun) =>
          this.buses.pipe(
            take(1),
            tap(console.log),
            filter((bus) => bus.kommun === busStartPositionsPerKommun.key),
            map((buses) => ({
              buses,
              stops: busStartPositionsPerKommun.pipe(toArray()),
            })),
            bufferCount(200, 1000)
          )
        )
      )
      .subscribe(({ buses, stops }) => {
        busDispatch(buses, stops).subscribe(({ bus, stops }) => {
          stops.map((stop) => bus.handledBooking(stop))
        })
      })

    taxiDispatch(this.taxis, passengers).subscribe((e) => {
      e.map(({ taxi, steps }) => steps.map((step) => taxi.addInstruction(step)))
    })
  }
}

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
