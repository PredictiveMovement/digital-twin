const { from, shareReplay, Subject, ReplaySubject, mergeMap } = require('rxjs')
const { map, first, groupBy, toArray, count } = require('rxjs/operators')
const Bus = require('./vehicles/bus')
const { safeId } = require('./id')
const { taxiDispatch } = require('./taxiDispatch')
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
  }) {
    this.geometry = geometry
    this.name = name
    this.id = id
    this.unhandledBookings = new Subject()
    this.stops = stops
    this.passengers = passengers.pipe(shareReplay())
    this.lineShapes = lineShapes

    this.buses = new ReplaySubject()
    this.taxis = new ReplaySubject()

    stopTimes
    .pipe(
      groupBy(({ tripId }) => tripId),
      mergeMap((stopTimesPerRoute) => {
        const stops = stopTimesPerRoute.pipe(shareReplay())
        return stops.pipe(
          first(),
          map((firstStopTime) => {
            this.taxis.next(createTaxi(firstStopTime))
            this.buses.next(createBus(firstStopTime, stops))
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
  })

module.exports = Region
