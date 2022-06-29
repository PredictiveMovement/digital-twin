const {
  from,
  shareReplay,
  share,
  Subject,
  ReplaySubject,
  mergeMap,
  merge,
  of,
  range,
} = require('rxjs')
const {
  map,
  tap,
  filter,
  catchError,
  toArray,
  first,
  reduce,
  mapTo,
  groupBy,
} = require('rxjs/operators')
const { tripsMap } = require('../streams/gtfs')
const Bus = require('./vehicles/bus')
const dispatch = require('./dispatchCentral')

class Region {
  constructor({ geometry, name, id, stops, stopTimes, passengers }) {
    this.geometry = geometry
    this.name = name
    this.id = id
    this.unhandledBookings = new Subject()
    this.stops = stops

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
    dispatch([new Taxi()], this.generateBookings(passengers))
  }

  generateBookings(passengers) {
    return passengers.pipe(
      mergeMap((passenger) => {
        return new Booking({
          pickup: passenger.from,
          destination: passenger.to,
        })
      })
    )
  }
}

module.exports = Region
