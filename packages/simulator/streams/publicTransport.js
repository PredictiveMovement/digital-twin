const fetch = require('node-fetch')
const key = process.env.TRAFIKLAB_KEY // log in to trafiklab.se and get a key
const path = require('path')
const moment = require('moment')

const { shareReplay, from, of, firstValueFrom, groupBy, pipe } = require('rxjs')
const {
  map,
  mergeMap,
  filter,
  first,
  catchError,
  reduce,
  toArray,
  tap,
  mergeAll,
} = require('rxjs/operators')
const { error } = require('../lib/log.js')

const reduceMap = (idProp = 'id') =>
  pipe(reduce((map, item) => map.set(item[idProp], item), new Map()))

const addProp = (prop, fn) =>
  pipe(
    map((item) => ({
      ...item,
      [prop]: fn(item),
    }))
  )

async function getStopsForDate(date, operator) {
  const { stops, busStops, trips, serviceDates, routeNames } =
    require('./gtfs.js')(operator)

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

  const stopTimeToDate = (stopTime) => moment(stopTime, 'HH:mm:ss').toDate()

  const lineShapes = todaysStops.pipe(
    groupBy((line) => line.tripId),
    mergeMap((group) =>
      group.pipe(
        toArray(),
        map((stops) => {
          const count = stops.length
          return {
            lineNumber: stops[0].lineNumber,
            from: stops[0].stop.name,
            to: stops[count - 1].stop.name,
            tripId: group.key,
            stops: stops.map(({ stop }) => stop.position),
            count,
          }
        })
      )
    ),
    catchError((err) => {
      error('GTFS error', err)
      return of(err)
    }),
    shareReplay()
  )
  return {
    stops: todaysStops,
    lineShapes,
  }
}

module.exports = publicTransport
