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
  concatMap,
  filter,
  toArray,
  first,
  share,
  tap,
} = require('rxjs/operators')
const {
  stops,
  busStops,
  trips,
  serviceDates,
  tripsMap,
  serviceDatesMap,
} = require('./gtfs.js')

//console.log(serviceDatesMap)
// const todaysServices = serviceDates.pipe(
//   filter(({ date }) => moment(virtualTime.time()).isSame(moment(date), 'day'))
// )

// stop_times.trip_id -> trips.service_id -> calendar_dates.service_id
const todaysDate = moment(virtualTime.time()).format('YYYYMMDD')
const todaysServiceIds = serviceDatesMap[todaysDate]
console.log(todaysServiceIds)

const enhancedBusStops = busStops.pipe(
  map(({ tripId, ...rest }) => {
    const trip = tripsMap[tripId]
    return {
      trip,
      date: serviceDatesMap[trip.serviceId].date,
      ...rest,
    }
  }),

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
