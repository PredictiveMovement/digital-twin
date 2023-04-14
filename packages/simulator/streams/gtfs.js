const key = process.env.TRAFIKLAB_KEY || '72ed2139ebb3498d9559798b502ed209'
// log in to trafiklab.se and get a key or use ours - it's free and public domain, shouldn't be a problem to share like this?

const fs = require('fs')
const path = require('path')
const parse = require('csv-parse/lib/sync')
const { info, error } = require('../lib/log')

const AdmZip = require('adm-zip')
const fetch = require('node-fetch')
const { shareReplay, Observable } = require('rxjs')
const { map, toArray } = require('rxjs/operators')
const csv = require('csv-stream')

const MONTH = 1000 * 60 * 60 * 24 * 30

const downloadIfNotExists = (operator) => {
  const zipFile = path.join(__dirname, `../data/${operator}.zip`)
  const outPath = path.join(__dirname, `../.cache/${operator}`)
  return new Promise((resolve, reject) => {
    const url = `https://opendata.samtrafiken.se/gtfs/${operator}/${operator}.zip?key=${key}`
    const stream = fs.createWriteStream(zipFile)
    const zipFileAge =
      fs.existsSync(zipFile) && Date.now() - fs.statSync(zipFile).mtimeMs
    if (
      !fs.existsSync(zipFile) ||
      !fs.existsSync(outPath) ||
      zipFileAge > 1 * MONTH
    ) {
      fetch(url).then((res) =>
        res.body
          .pipe(stream)
          .on('finish', () => {
            info('Downloaded GTFS')
            try {
              const zip = new AdmZip(zipFile)
              if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, true)
              zip.extractAllTo(outPath, true)
            } catch (e) {
              fs.rmSync(zipFile)
              error('Error extracting GTFS', e)
              return reject(e)
            }
            info('Extracted GTFS')
            resolve()
          })
          .on('error', (err) => {
            error('Error downloading GTFS', err)
            reject(err)
          })
      )
    } else {
      resolve()
    }
  })
}

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

const routeNamesMapper = ({ route_id: id, route_short_name: lineNumber }) => ({
  id,
  lineNumber,
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

function gtfs(operator) {
  const download = downloadIfNotExists(operator)
  const gtfsStream = (file) => {
    return new Observable((observer) => {
      download.then(() => {
        const stream = fs
          .createReadStream(
            path.join(__dirname, `../../.cache/${operator}/${file}.txt`)
          )
          .pipe(csv.createStream({ enclosedChar: '"' }))
        stream.on('data', (data) => {
          return observer.next(data)
        })
        stream.on('end', () => observer.complete())
        stream.on('finish', () => {
          info(`FINISH ${file}`)
          return observer.complete() // memory leak?
        })
      })
    })
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
  const routeNames = gtfsStream('routes').pipe(
    map(routeNamesMapper),
    shareReplay()
  )

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
        stop_headsign: finalStop,
        trip_id: tripId,
        arrival_time: arrivalTime,
        departure_time: departureTime,
      }) => ({ stopId, tripId, arrivalTime, departureTime, finalStop })
    ),
    shareReplay()
  )
  return {
    busStops,
    stops,
    trips,
    serviceDates,
    routeNames,
  }
}

module.exports = gtfs
