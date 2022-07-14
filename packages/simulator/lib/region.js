const { from, shareReplay, Subject, mergeMap } = require('rxjs')
const { map, first, groupBy } = require('rxjs/operators')
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

    this.buses = stopTimes.pipe(
      groupBy(({ tripId }) => tripId),
      mergeMap((stopTimesPerRoute) => {
        const stops = stopTimesPerRoute.pipe(shareReplay())
        return stops.pipe(
          first(),
          map((firstStopTime) => {
            return new Bus({
              id: firstStopTime.tripId,
              finalStop: firstStopTime.finalStop,
              lineNumber: firstStopTime.lineNumber,
              position: firstStopTime.position,
              stops,
            })
          })
        )
      }),
      shareReplay()
    )

    this.taxis = from([
      new Taxi({ id: safeId(), position: { lon: 17.867348, lat: 66.065143 } }),
    ]).pipe(shareReplay())

    taxiDispatch(this.taxis, passengers).subscribe((e) => {
      e.map(({ taxi, steps }) => steps.map((step) => taxi.addInstruction(step)))
    })
  }
}

module.exports = Region
