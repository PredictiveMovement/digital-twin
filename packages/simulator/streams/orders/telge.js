const { from, pipe } = require('rxjs')
const {
  map,
  mergeMap,
  catchError,
  filter,
  shareReplay,
  raceWith,
  toArray,
  mergeAll,
  tap,
  take,
} = require('rxjs/operators')
const Position = require('../../lib/models/position')
const Booking = require('../../lib/models/booking')
const { error } = require('../../lib/log')
const { nearest } = require('../../lib/pelias')
const fs = require('fs')
const LERHAGA_POSITION = new Position({ lat: 59.135449, lon: 17.571239 })

const mapper = () =>
  pipe(
    map(
      ({
        Turid: id,
        Datum: pickupDate,
        Tjtyp: serviceType,
        Lat: lat,
        Lng: lon,
        Bil: carId,
        Turordningsnr: order,
        Avftyp: recyclingType,
      }) => ({
        id,
        pickup: {
          name: serviceType,
          date: pickupDate,
          position: new Position({ lat, lon }),
        },
        weight: 10,
        sender: 'TELGE',
        serviceType,
        carId: carId.trim(),
        order,
        recyclingType,
        destination: {
          name: 'LERHAGA 50, 151 66 Södertälje',
          position: LERHAGA_POSITION,
        },
      })
    ),
    filter(({ pickup }) => pickup.position.isValid()),
    mergeMap(async (row) => {
      try {
        const pickup = await nearest(row.pickup.position, 'address')
        return {
          ...row,
          pickup: {
            ...row.pickup,
            postalcode: pickup?.postalcode || '',
          },
        }
      } catch (err) {
        error(`Error fetching nearest address for row ${row.id}:`, err)
        return row
      }
    })
  )

function writeToCache(filename) {
  return pipe(
    toArray(),
    tap((rows) => fs.writeFileSync(filename, JSON.stringify(rows))),
    tap(() => console.log(`TELGE -> writeToCache: ${filename}`)),
    mergeAll(),
    catchError((err) => {
      error('TELGE -> writeToCache', err)
      return from([])
    })
  )
}

function read() {
  const rutter = () =>
    from(require('../../data/telge/ruttdata_2024-09-03.json')).pipe(
      tap('NO CACHE. Generating. This might take a few minutes...'),
      mapper(),
      writeToCache('bookingsCache.json')
    )

  const cacheExists = fs.existsSync('bookingsCache.json')
  const bookingsCache = cacheExists && fs.readFileSync('bookingsCache.json')
  const cache = !bookingsCache ? from([]) : from(JSON.parse(bookingsCache))

  return (cacheExists ? cache : from(rutter())).pipe(
    map((row) => new Booking({ type: 'recycle', ...row })),
    shareReplay(),
    catchError((err) => {
      error('TELGE -> from JSON', err)
      return from([])
    })
  )
}

module.exports = read()
