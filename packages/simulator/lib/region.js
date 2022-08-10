const { from, shareReplay, Subject, ReplaySubject, mergeMap } = require('rxjs')
const {
  map,
  first,
  groupBy,
  tap,
  toArray,
  find,
  count,
} = require('rxjs/operators')
const Bus = require('./vehicles/bus')
const { safeId } = require('./id')
const { taxiDispatch } = require('./taxiDispatch')
const Pelias = require('./pelias')
const Taxi = require('./vehicles/taxi')

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
                this.buses.next(createBus({ position }, from([])))
              )
            )
        })
      )
      .subscribe((_) => null)

    stopTimes
      .pipe(
        groupBy(({ tripId }) => tripId),
        mergeMap((stopTimesPerRoute) => {
          const stops = stopTimesPerRoute.pipe(shareReplay())
          return stops.pipe(
            first(),
            map((firstStopTime) => {
              // this.taxis.next(createTaxi(firstStopTime))
              // this.buses.next(createBus(firstStopTime, stops))
            })
          )
        })
      )
      .subscribe((_) => null)

    taxiDispatch(this.taxis, passengers).subscribe((e) => {
      e.map(({ taxi, steps }) => steps.map((step) => taxi.addInstruction(step)))
    })
  }
}

const createTaxi = ({ position }) => new Taxi({ id: safeId(), position })

const createBus = ({ tripId, finalStop, lineNumber, position }, stops) =>
  new Bus({
    id: tripId,
    finalStop,
    lineNumber,
    position,
    stops,
    heading: position,
  })

module.exports = Region
