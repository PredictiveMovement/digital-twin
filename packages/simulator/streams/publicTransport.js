const fetch = require('node-fetch')
const key = process.env.TRAFIKLAB_KEY // log in to trafiklab.se and get a key
const fs = require('fs')
const path = require('path')
const { virtualTime } = require('../lib/virtualTime')
const moment = require('moment')

//const url = `https://opendata.samtrafiken.se/gtfs/${operator}/${operator}.zip?key=${key}`
const request = require('request')
const { shareReplay, from, of, firstValueFrom, groupBy, take } = require('rxjs')
const {
  map,
  mergeMap,
  filter,
  first,
  tap,
  reduce,
  distinct,
  zip,
  bufferTime,
} = require('rxjs/operators')
const {
  stops,
  busStops,
  tripsMap,
  serviceDatesMap,
  routeNamesMap,
} = require('./gtfs.js')

// stop_times.trip_id -> trips.service_id -> calendar_dates.service_id
const todaysDate = moment().format('20221130')
const todaysServiceIds = serviceDatesMap[todaysDate].map(
  ({ serviceId }) => serviceId
)

const enhancedBusStops = busStops.pipe(
  map(({ tripId, ...rest }) => {
    const trip = tripsMap[tripId]
    const lineNumber = routeNamesMap[trip.routeId].lineNumber

    return {
      trip,
      tripId,
      lineNumber,
      ...rest,
    }
  }),
  filter(({ trip: { serviceId } }) => todaysServiceIds.includes(serviceId)),
  mergeMap(({ stopId, ...rest }) =>
    stops.pipe(
      first((stop) => stop.id === stopId, 'stop not found'),
      map((stop) => ({ ...rest, stop }))
    )
  ),

  map(({ stop: { position, name: stopName }, ...rest }) => ({
    ...rest,
    stopName,
    position: { lat: +position.lat, lon: +position.lon },
  })),
  shareReplay()
)

const stopTimeToDate = (stopTime) =>
  new Date(`${new Date().toISOString().slice(0, 11)}${stopTime}`)

const lineShapes = enhancedBusStops.pipe(
  map(
    ({
      lineNumber,
      stopName,
      arrivalTime,
      tripId,
      position: { lat, lon },
    }) => ({
      lineNumber,
      arrivalTime,
      stopName,
      tripId,
      stop: {
        name: stopName,
        position: [lon, lat],
      },
    })
  ),
  groupBy((line) => line.tripId, { element: (line) => line }),
  mergeMap((trip) =>
    trip.pipe(reduce((acc, cur) => [...acc, cur], [`${trip.key}`]))
  ),
  map((arr) => {
    const values = arr
      .slice(1)
      .sort(
        (a, b) => stopTimeToDate(a.arrivalTime) - stopTimeToDate(b.arrivalTime)
      )
    const count = values.length
    return {
      lineNumber: arr[1].lineNumber,
      tripId: arr[0],
      stops: values.map(({ stop }) => stop.position),
      count,
    }
  }),
  groupBy((trip) => trip.lineNumber),
  mergeMap((lineTrips) =>
    lineTrips.pipe(
      reduce((acc, curr) => {
        if (
          acc !== undefined &&
          curr !== undefined &&
          (acc.count === undefined || acc.count < curr.count)
        ) {
          acc = curr
        }
        return acc
      }, {})
    )
  ),
  map(({ lineNumber, stops }) => ({ lineNumber, stops }))
)

module.exports = {
  stops,
  stopTimes: enhancedBusStops,
  lineShapes,
}
