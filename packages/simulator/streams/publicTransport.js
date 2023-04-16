const moment = require('moment')
const gtfs = require('./gtfs.js')

const { shareReplay, from, of, firstValueFrom, groupBy, pipe } = require('rxjs')
const {
  map,
  mergeMap,
  filter,
  catchError,
  reduce,
  toArray,
  mergeAll,
} = require('rxjs/operators')
const { error } = require('../lib/log.js')

const reduceMap = (idProp = 'id') =>
  pipe(reduce((map, item) => map.set(item[idProp], item), new Map()))

const addProp = (prop, fn) =>
  pipe(
    map((item) =>
      Object.assign(item, {
        [prop]: fn(item),
      })
    )
  )

async function getStopsForDate(date, operator) {
  const { stops, busStops, trips, serviceDates, routeNames } = gtfs(operator)

  const allTrips = await firstValueFrom(trips.pipe(reduceMap()))
  const allRouteNames = await firstValueFrom(routeNames.pipe(reduceMap()))
  const allStops = await firstValueFrom(stops.pipe(reduceMap()))
  const allServices = await firstValueFrom(serviceDates.pipe(reduceMap('date')))
  const todaysServices = allServices.get(date).services

  return busStops.pipe(
    addProp('trip', (stop) => allTrips.get(stop.tripId)),
    addProp('route', ({ trip: { routeId } }) => allRouteNames.get(routeId)),
    addProp('lineNumber', ({ route }) => route.lineNumber),
    filter(({ trip: { serviceId } }) => todaysServices.includes(serviceId)),
    addProp('stop', (stop) => allStops.get(stop.stopId)),
    addProp('position', ({ stop }) => stop.position),
    catchError((err) => {
      error('PublicTransport error', err)
      throw err
    })
  )
}

function publicTransport(operator) {
  // stop_times.trip_id -> trips.service_id -> calendar_dates.service_id
  const todaysDate = moment().format('YYYYMMDD')

  const todaysStops = from(getStopsForDate(todaysDate, operator)).pipe(
    mergeAll(),
    shareReplay()
  )

  const lineShapes = todaysStops.pipe(
    groupBy((line) => line.tripId),
    mergeMap((group) => group.pipe(toArray())),
    map((stops) => ({
      tripId: stops[0].tripId,
      lineNumber: stops[0].lineNumber,
      from: stops[0].stop.name,
      to: stops[stops.length - 1].stop.name,
      stops: stops.map(({ stop }) => stop.position),
    })),
    catchError((err) => error('GTFS', err)),
    shareReplay()
  )
  return {
    stops: todaysStops,
    lineShapes,
  }
}

module.exports = publicTransport
