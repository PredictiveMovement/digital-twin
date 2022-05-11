const fetch = require('node-fetch')
const key = process.env.TRAFIKLAB_KEY // log in to trafiklab.se and get a key
const operator = 'norrbotten_light'
const fs = require('fs')
const path = require('path')

//const url = `https://opendata.samtrafiken.se/gtfs/${operator}/${operator}.zip?key=${key}`
const gtfs = require('gtfs-stream')
const request = require('request')
const {shareReplay, from, of, firstValueFrom, groupBy, take} = require('rxjs')
const {
  map,
  mergeMap,
  switchMap,
  filter,
  toArray,
  share,
  tap,
} = require('rxjs/operators')

const getBusStops = from(
  fs
    .createReadStream(path.join(__dirname, `../data/${operator}.zip`))
    .pipe(gtfs({raw: true}))
).pipe(
  filter(({type}) => type === 'stop'),
  map(
    ({
      data: {stop_id: stopId, stop_name: name, stop_lat: lat, stop_lon: lon},
    }) => ({position: {lat, lon}, name})
  ),
  shareReplay()
)

const getStops = () => {
  const stream = from(
    fs
      .createReadStream(path.join(__dirname, `../data/${operator}.zip`))
      .pipe(gtfs({raw: true}))
  ).pipe(shareReplay())

  const stops = firstValueFrom(
    stream.pipe(
      filter(({type}) => type === 'stop'),
      map(
        ({
          data: {
            stop_id: stopId,
            stop_name: name,
            stop_lat: lat,
            stop_lon: lon,
          },
        }) => ({stopId, name, position: {lat, lon}})
      ),
      toArray()
    )
  )

  return stream.pipe(
    filter(({type}) => type === 'stop_time'),
    map(
      ({
        data: {
          stop_id: id,
          trip_id: tripId,
          arrival_time: arrivalTime,
          departure_time: departureTime,
        },
      }) => ({id, tripId, arrivalTime, departureTime})
    ),
    mergeMap(async ({id, tripId, arrivalTime, departureTime}) =>
      (await stops)
        .filter(({stopId}) => stopId === id)
        .map(({name, position}) => ({
          id,
          tripId,
          arrivalTime,
          departureTime,
          name,
          position,
        }))
        .shift()
    )
  )
}
module.exports = {
  getBusStops,
  getStopTimes: getStops(),
}
