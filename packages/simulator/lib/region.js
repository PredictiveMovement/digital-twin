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
const { safeId } = require('./id')
const { taxiDispatch } = require('./taxiDispatch')
const Taxi = require('./vehicles/taxi')
const Booking = require('./booking')

class Region {
  constructor({ geometry, name, id, stops, stopTimes, passengers }) {
    this.geometry = geometry
    this.name = name
    this.id = id
    this.unhandledBookings = new Subject()
    this.stops = stops
    this.passengers = passengers

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
      new Taxi({ id: safeId(), position: { lon: 10.886855, lat: 50.041054 } }),
      new Taxi({ id: safeId(), position: { lon: 17.686855, lat: 66.141054 } }),
    ]) // En taxi i Arjeplog.

    this.journeys = taxiDispatch(this.taxis, passengers) /*.subscribe((e) => {
      console.log('Taxi bookings', JSON.stringify(e, null, 2))
    })*/
  }
}

module.exports = Region
