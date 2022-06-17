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
const Bus = require('./vehicles/bus')

class Region {
  constructor({ geometry, name, id, stops, stopTimes }) {
    this.geometry = geometry
    this.name = name
    this.id = id
    this.unhandledBookings = new Subject()
    this.stops = stops

    this.buses = stopTimes.pipe(
      groupBy(({ trip }) => trip?.routeId),
      mergeMap((stopTimesPerRoute) => {
        const stops = stopTimesPerRoute.pipe(share())
        return stopTimesPerRoute.pipe(
          first(),
          map((firstStopTime) => {
            return new Bus({
              id: firstStopTime.trip.routeId,
              position: firstStopTime.position,
              stops,
            })
          })
        )
      }),
      shareReplay()
    )
  }
}

module.exports = Region
