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
  switchMap,
  filter,
  toArray,
  first,
  share,
  tap,
} = require('rxjs/operators')
const { stops, busStops, trips, calendarDates } = require('./gtfs')

const todaysCalendarDates = calendarDates.pipe(
  filter(({ date }) => moment(virtualTime.time()).isSame(moment(date), 'day')),
  shareReplay()
)

// stop_times.trip_id -> trips.service_id -> calendar_dates.service_id
const enhancedBusStops = busStops.pipe(
  mergeMap(({ tripId, ...rest }) =>
    trips.pipe(
      first((trip) => trip.id === tripId, 'trip not found'),
      map((trip) => ({ ...rest, trip }))
    )
  ),
  mergeMap(({ trip, ...rest }) =>
    todaysCalendarDates.pipe(
      first((cd) => cd.id === trip.serviceId, 'calendar date not found'),
      map(({ date }) => ({ ...rest, trip, date }))
    )
  ),

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

module.exports = {
  stops,
  stopTimes: enhancedBusStops,
}
//enhancedBusStops.subscribe((x) => console.log(x))
