const key = process.env.TRAFIKLAB_KEY // log in to trafiklab.se and get a key
const operator = 'norrbotten'
const fs = require('fs')
const path = require('path')
const parse = require('csv-parse/lib/sync')

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

const tripMapper = ({
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

const serviceDatesMapper = ({
  service_id: serviceId,
  date: date,
  exception_type: exceptionType,
}) => ({
  serviceId,
  date,
  exceptionType,
})

const gtfsStream = (file) => {
  return new Observable((observer) => {
    const stream = fs
      .createReadStream(path.join(__dirname, `../data/${operator}/${file}.txt`))
      .pipe(csv.createStream())
    stream.on('data', (data) => {
      // console.log(`data ${Object.values(data)}`)
      return observer.next(data)
    })
    stream.on('end', () => observer.complete())
    stream.on('finish', () => {
      console.log(`FINISH ${file}`)
      return observer.complete() // memory leak?
    })
  })
}

const getMap = (fileName, mapper) => {
  const data = fs.readFileSync(
    path.join(__dirname, `../data/${operator}/${fileName}.txt`),
    'utf8'
  )
  return parse(data, { columns: true })
    .map(mapper)
    .reduce((acc, { id, ...rest }) => {
      acc[id] = rest
      return acc
    }, {})
}

const getServicesMap = (fileName, mapper) => {
  const data = fs.readFileSync(
    path.join(__dirname, `../data/${operator}/${fileName}.txt`),
    'utf8'
  )
  return parse(data, { columns: true })
    .map(mapper)
    .reduce((acc, { date, exceptionType, serviceId }) => {
      if (acc[date]) {
        acc[date].push({ serviceId, exceptionType })
      } else {
        acc[date] = [{ serviceId, exceptionType }]
      }

      return acc
    }, {})
}
const stops = gtfsStream('stops').pipe(
  map(
    ({
      stop_id: id,
      stop_name: name,
      stop_lat: lat,
      stop_lon: lon,
      parent_station,
      platform_code,
    }) => ({
      id,
      name,
      position: { lat, lon },
      station: parent_station,
      platform: platform_code,
    })
  ),
  shareReplay()
)

const trips = gtfsStream('trips').pipe(map(tripMapper), shareReplay())

// The calendar_dates file contains exceptions for when services run on schedule
// TODO: To become GTFS-compliant we need to add scheduling with these positive
// and negative exceptions. However Norrbotten does not use calendar scheduling,
// only positive exceptions which allows us to take this shortcut/technical debt.
const serviceDates = gtfsStream('calendar_dates').pipe(
  map(serviceDatesMapper),
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
  serviceDates,
  serviceDatesMap: getServicesMap('calendar_dates', serviceDatesMapper),
  tripsMap: getMap('trips', tripMapper),
}
