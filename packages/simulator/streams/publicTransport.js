const fetch = require('node-fetch')
const key = process.env.TRAFIKLAB_KEY // log in to trafiklab.se and get a key
const operator = 'norrbotten_light'
const fs = require('fs')
const url = `https://opendata.samtrafiken.se/gtfs/${operator}/${operator}.zip?key=${key}`
const gtfs = require('gtfs-stream')
const request = require('request')
const { shareReplay, from, of, firstValueFrom } = require('rxjs')
const {
  map,
  mergeMap,
  filter,
  toArray,
  share,
} = require('rxjs/operators')

const getStops = async () => {
  console.log(url)
  const stream = from(fs
    .createReadStream(`../data/${operator}.zip`)
    .pipe(gtfs({ raw: true })))
    .pipe(
      shareReplay()
    )

  const stops = await firstValueFrom(stream.pipe(
    filter(({ type }) => type === 'stop'),
    map(
      ({
        data: { stop_id: stopId, stop_name: name, stop_lat: lat, stop_lon: lon },
      }) => ({ stopId, name, position: { lat, lon } })
    ),
    toArray()
  ))

  const stopTimes = stream.pipe(
    filter(({ type }) => type === 'stop_time'),
    map(
      ({
        data: {
          stop_id: id,
          trip_id: tripId,
          arrival_time: arrivalTime,
          departure_time: departureTime,
        },
      }) => ({ id, tripId, arrivalTime, departureTime })
    ),
    mergeMap(({ id, tripId, arrivalTime, departureTime }) =>
      of(stops
        .filter(({ stopId }) => stopId === id)
        .map(({ name, position }) => ({ id, tripId, arrivalTime, departureTime, name, position })).shift()
      )
    ),
    shareReplay(),
  )

  //stops.forEach(stop => console.log(stop))
  //stopTimes.forEach((stop) => console.log('stop_time', stop))

}

module.exports = getStops()

