const { from } = require('rxjs')
const {
  map,
  mergeMap,
  catchError,
  toArray,
  mergeAll,
  filter,
  take,
  share,
  tap,
} = require('rxjs/operators')
const { searchOne } = require('../../lib/pelias')
const Position = require('../../lib/models/position')
const Booking = require('../../lib/models/booking')
const { error } = require('../../lib/log')
//const { tr } = require('date-fns/locale')

function read() {
  const rutter = require('../../data/telge/ruttdata_2024-09-03.json')
  console.log('TELGE -> read: Loaded data with', rutter.length, 'entries')
  // TODO: add error handling

  // Check if data is loaded correctly
  if (!Array.isArray(rutter) || rutter.length === 0) {
    console.error('Error: No data loaded from the JSON file.')
    return
  }

  try {
    return from(rutter).pipe(
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
          sender: 'TELGE',
          serviceType,
          carId: carId.trim(),
          order,
          recyclingType,
        })
      ),
      filter(({ pickup }) => pickup.position.isValid()),
      toArray(),
      mergeMap(async (rows) => {
        return rows.map((row) => ({
          ...row,
          destination: {
            name: "LERHAGA 50, 151 66 Södertälje",
            position: new Position({ lat: 59.135449, lon: 17.571239 }),
          },
        }))
      }, 1),
      mergeAll(),
      map((row) => new Booking({ type: 'recycle', ...row })),
      //tap((booking) => console.log('📋 Booking created:', booking.id)), // Log each booking
      share(),
      catchError((err) => {
        error('TELGE -> from JSON', err)
      })
    )
  } catch (err) {
    console.error('Error:', err)
    return
  }
}

module.exports = read()
