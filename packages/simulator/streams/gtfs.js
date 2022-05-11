const fetch = require('node-fetch')
const key = process.env.TRAFIKLAB_KEY // log in to trafiklab.se and get a key
const operator = 'norrbotten_light'
const fs = require('fs')
const path = require('path')

//const url = `https://opendata.samtrafiken.se/gtfs/${operator}/${operator}.zip?key=${key}`
const gtfs = require('gtfs-stream')
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

const getGtfsStream = () =>
  from(
    fs
      .createReadStream(path.join(__dirname, `../data/${operator}.zip`))
      .pipe(gtfs({raw: true}))
  ).pipe(shareReplay())



const getStops = async () => {
  const stops = await firstValueFrom(
    getGtfsStream().pipe(
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
  return stops.reduce((acc, {stopId, ...rest}) => {
    acc[stopId] = rest
    return acc
  }, {})

}

module.exports = {
  getGtfsStream,
  getStops
}
