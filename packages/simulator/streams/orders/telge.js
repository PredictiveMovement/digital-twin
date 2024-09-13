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
  tap
} = require('rxjs/operators')
const { searchOne } = require('../../lib/pelias')
const Position = require('../../lib/models/position')
const Booking = require('../../lib/models/booking')
const { error } = require('../../lib/log')

function read() {
  const rutter = require('../../data/telge/ruttdata_2024-09-03.json')
  console.log('TELGE -> read')
  // TODO: add error handling
  return from(rutter).pipe(
    map(
      ({
        Turid: id,
        Datum: pickupDate,
        Tjtyp: serviceType,
        Lat: lat,
        Lng: lon,
      }) => ({
        id,
        pickup: {
          name: serviceType,
          date: pickupDate,
          position: new Position({ lat, lon }),
        },
        sender: 'TELGE',
        serviceType,
      })
    ),
    filter(({ pickup }) => pickup.position.isValid()),
    toArray(),
    mergeMap(async (rows) => {
      // TODO: Where do we leave the trash?
      const recyleCenters = [
        'Pålhagsvägen 4, Södertälje',
        'Bovallsvägen 5, 152 42 Södertälje',
      ]
      const deliveryPoints = await Promise.all(
        recyleCenters.map((addr) =>
          searchOne(addr).then(({ name, position }) => ({ name, position }))
        )
      )
      return rows.map((row, i) => ({
        ...row,
        id: row.id + '_' + i,
        destination: deliveryPoints[i % deliveryPoints.length],
      }))
    }, 1),
    mergeAll(),
    take(5), // Start with just 500 bookings
    map((row) => new Booking({ type: 'recycle', ...row })),
    tap((booking) => console.log('TELGE -> booking', booking)),
    share(),
    catchError((err) => {
      error('TELGE -> from CSV', err)
    })
  )
}

module.exports = read()
