const fetch = require('node-fetch')
const key = process.env.TRAFIKLAB_KEY // log in to trafiklab.se and get a key
const operator = 'norrbotten'
const fs = require('fs')
const path = require('path')

//const url = `https://opendata.samtrafiken.se/gtfs/${operator}/${operator}.zip?key=${key}`
const gtfs = require('gtfs-stream')
const {
  shareReplay,
  from,
  of,
  firstValueFrom,
  groupBy,
  take,
  Observable,
} = require('rxjs')
const {
  map,
  mergeMap,
  switchMap,
  filter,
  toArray,
  share,
  reduce,
  tap,
} = require('rxjs/operators')
const csv = require('csv-stream')
const byline = require('byline')

const gtfsStream = (file) => {
  return new Observable((observer) => {
    const stream = fs
      .createReadStream(path.join(__dirname, `../data/${operator}/${file}.txt`))
      .pipe(csv.createStream())
    stream.on('data', (data) => observer.next(data))
    stream.on('finish', () => observer.complete()) // memory leak?
  })
}

const stops = gtfsStream('stops').pipe(
  map(({ stop_id: id, stop_name: name, stop_lat: lat, stop_lon: lon }) => ({
    id,
    name,
    position: { lat, lon },
  })),
  shareReplay()
)

const trips = gtfsStream('trips').pipe(
  map(
    ({
      trip_id: id,
      service_id: serviceId,
      trip_headsign: headsign,
      route_id: routeId,
    }) => ({
      id,
      serviceId,
      headsign,
      routeId,
    })
  ),
  shareReplay()
)

const calendarDates = gtfsStream('calendar_dates').pipe(
  map(({ service_id: id, date: date, exception_type: exceptionType }) => ({
    id,
    date,
    exceptionType,
  })),
  shareReplay()
)

const busStops = gtfsStream('stop_times').pipe(
  map(
    ({
      stop_id: stopId,
      trip_id: tripId,
      arrival_time: arrivalTime,
      departure_time: departureTime,
    }) => ({ stopId, tripId, arrivalTime, departureTime })
  ),
  shareReplay()
)

module.exports = {
  busStops,
  stops,
  trips,
  calendarDates,
}
