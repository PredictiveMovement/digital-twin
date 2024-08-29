const key = process.env.TRAFIKLAB_KEY || '62262314de784de6847954de884334f1' // Fallback key used for development.
// log in to trafiklab.se and get a key or use ours - it's free and public domain, shouldn't be a problem to share like this?

const fs = require('fs')
const path = require('path')
const { info, error, debug } = require('../lib/log')

const AdmZip = require('adm-zip')
const fetch = require('node-fetch')
const { shareReplay, Observable } = require('rxjs')
const { map, toArray, groupBy, mergeMap, filter } = require('rxjs/operators')
const csv = require('csv-stream')
const Position = require('../lib/models/position')

const MONTH = 1000 * 60 * 60 * 24 * 30

const downloadIfNotExists = (operator) => {
  const zipFile = path.join(__dirname, `../data/${operator}.zip`)
  return new Promise((resolve, reject) => {
    const url = `https://opendata.samtrafiken.se/gtfs/${operator}/${operator}.zip?key=${key}`
    const zipFileAge =
      fs.existsSync(zipFile) && Date.now() - fs.statSync(zipFile).mtimeMs
    const zipFileSize = fs.existsSync(zipFile) && fs.statSync(zipFile).size
    if (
      !fs.existsSync(zipFile) ||
      zipFileSize < 5000 ||
      zipFileAge > 1 * MONTH
    ) {
      const stream = fs.createWriteStream(zipFile)
      info('Downloading GTFS', url)
      fetch(url)
        .then((res) =>
          res.body
            .pipe(stream)
            .on('finish', () => {
              info('Downloaded GTFS')
              resolve(zipFile)
            })
            .on('error', (err) => {
              error('Error downloading GTFS', err)
              reject(err)
            })
        )
        .catch((err) => error('Error fetching GTFS', err) || reject(err))
    } else {
      resolve(zipFile)
    }
  })
}

const downloadAndExtractIfNotExists = (operator) => {
  return downloadIfNotExists(operator)
    .then((zipFile) => {
      try {
        const outPath = path.join(__dirname, `../.cache/${operator}`)
        const zip = new AdmZip(zipFile)
        if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, true)
        zip.extractAllTo(outPath, true)
        return zipFile
      } catch (err) {
        error('Error unpacking', err)
        fs.rmSync(zipFile) // try again next time
      }
    })
    .catch((err) => {
      error('Error when unpacking GTFS file', err)
    })
}

function gtfs(operator) {
  const download = downloadAndExtractIfNotExists(operator)
  const gtfsStream = (file) => {
    return new Observable((observer) => {
      download.then(() => {
        const stream = fs
          .createReadStream(
            path.join(__dirname, `../.cache/${operator}/${file}.txt`)
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
        position: new Position({ lat: +lat, lon: +lon }),
        station: parent_station,
        platform: platform_code,
      })
    ),
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

  const routeNames = gtfsStream('routes').pipe(
    map(({ route_id: id, route_short_name: lineNumber }) => {
      return {
        id,
        lineNumber,
      }
    }),
    shareReplay()
  )

  /**
   * In addition to bus lines, GTFS data also contains boats, trains and other lines that are not relevant for us.
   * Therefore we create a stream of excluded line numbers that we can use to filter out unwanted lines.
   */

  const excludedLineNumbers = gtfsStream('routes').pipe(
    map(
      ({
        route_id: id,
        route_short_name: lineNumber,
        route_desc: description,
      }) => {
        return { id, lineNumber, description }
      }
    ),
    filter((route) => {
      switch (route.description) {
        case 'ForSea':
        case 'Krösatåg':
        case 'Närtrafik':
        case 'Plusresor':
        case 'Pågatåg':
        case 'PågatågExpress':
        case 'Spårvagn':
        case 'TEB planerad':
        case 'VEN trafiken':
        case 'Öresundståg':
          debug(
            `Excluding route ${route.lineNumber} (${route.id}). Reason: ${route.description}`
          )
          return true
        default:
          return false
      }
    }),
    map((route) => route.lineNumber),
    shareReplay()
  )

  // The calendar_dates file contains exceptions for when services run on schedule
  // TODO: To become GTFS-compliant we need to add scheduling with these positive
  // and negative exceptions. However Norrbotten does not use calendar scheduling,
  // only positive exceptions which allows us to take this shortcut/technical debt.
  const serviceDates = gtfsStream('calendar_dates').pipe(
    map(
      ({
        service_id: serviceId,
        date: date,
        exception_type: exceptionType,
      }) => ({
        serviceId,
        date,
        exceptionType,
      })
    ),
    groupBy((x) => x.date),
    map((group) => ({ date: group.key, services: group })),
    mergeMap((group) =>
      group.services.pipe(
        toArray(),
        map((services) => ({
          date: group.date,
          services: services.map((x) => x.serviceId),
        }))
      )
    ),
    shareReplay()
  )

  const correctTime = (time) => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const day = now.getDate()
    const regex = /^(\d{2}):(\d{2}):(\d{2})$/
    const [, hour, minute, second] = time.match(regex)

    // hours can be above 24 therefore we use the internal Date constructor
    // which handles this and shifts the date accordingly- ie 2023-04-01 25:00:00 -> 2023-04-02 01:00:00
    return new Date(year, month, day, +hour, +minute, +second)
  }

  const busStops = gtfsStream('stop_times').pipe(
    map(
      ({
        stop_id: stopId,
        stop_headsign: finalStop,
        trip_id: tripId,
        arrival_time: arrivalTime,
        departure_time: departureTime,
      }) => ({
        stopId,
        tripId,
        arrivalTime: correctTime(arrivalTime), // adjust for 27 hour clock
        departureTime: correctTime(departureTime), // adjust for 27 hour clock
        finalStop,
      })
    ),
    shareReplay()
  )
  return {
    busStops,
    stops,
    trips,
    serviceDates,
    routeNames,
    excludedLineNumbers,
  }
}

module.exports = gtfs
