const { from, pipe } = require('rxjs')
const { map, mergeMap, catchError, filter, share } = require('rxjs/operators')
const Position = require('../../lib/models/position')
const Booking = require('../../lib/models/booking')
const { error } = require('../../lib/log')
const { nearest } = require('../../lib/pelias')
const fs = require('fs')

function read() {
  const rutter = require('../../data/telge/ruttdata_2024-09-03.json')
  console.log('TELGE -> read: Loaded data with', rutter.length, 'entries')

  if (!Array.isArray(rutter) || rutter.length === 0) {
    console.error('Error: No data loaded from the JSON file.')
    return from([])
  }

  const LERHAGA_POSITION = new Position({ lat: 59.135449, lon: 17.571239 })

  const output = pipe(
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
  const cache = require('./output.json')

  return from(cache).pipe(
    map((row) => new Booking({ type: 'recycle', ...row })),
    share(),
    catchError((err) => {
      error('TELGE -> from JSON', err)
      return from([])
    })
  )
}

module.exports = read()
