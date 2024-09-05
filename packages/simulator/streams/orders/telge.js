const { from, shareReplay, filter } = require('rxjs')
const {
  map,
  toArray,
  mergeMap,
  groupBy,
  mergeAll,
  catchError,
  retryWhen,
  tap,
  delay,
} = require('rxjs/operators')
const { readCsv } = require('../../adapters/csv')
const { default: fetch } = require('node-fetch')
const { searchOne } = require('../../lib/pelias')
const Position = require('../../lib/models/position')
const Booking = require('../../lib/models/booking')
const { error } = require('../../lib/log')

const streamsUrl =
  process.env.STREAMS_URL || 'https://streams.telge.iteam.pub/addresses'

function read() {
  console.log('TELGE -> read')
  // TODO: add error handling
  return from(readCsv(process.cwd() + '/data/sodertalje/tomningar.csv')).pipe(
    catchError((err) => {
      error('TELGE -> from CSV', err)
    }),
    map(
      ({
        order_id: id,
        quantity,
        delivery_zip: deliveryZip,
        delivery_date: deliveryDate,
        origin,
        created,
        volume,
        weight,
        length,
      }) => ({
        id,
        quantity,
        deliveryZip,
        deliveryDate,
        origin,
        sender: 'TELGE',
        created,
        volume,
        weight,
        length,
      })
    ),
    tap((row) => console.log('TELGE -> row', row)),
    filter((row) => row.deliveryZip),
    groupBy((row) => row.id),
    mergeMap((group) =>
      group.pipe(
        toArray(),
        map((rows) => ({ key: group.key, rows }))
      )
    ),
    mergeMap(
      ({ key, rows }) =>
        fetch(`${streamsUrl}/zip/${rows[0].deliveryZip}?size=1&seed=${key}`)
          .then((res) => res.json())
          .then((addresses) =>
            addresses.map(({ address, position }, i) => ({
              destination: { address, position: new Position(position) },
              ...rows[i],
            }))
          ),
      1
    ),
    retryWhen((errors) =>
      errors.pipe(
        tap((err) => error('Zip streams error, retrying in 1s...', err)),
        delay(1000)
      )
    ),
    mergeAll(),
    groupBy((row) => row.origin),
    mergeMap((group) =>
      group.pipe(
        toArray(),
        map((rows) => ({ key: group.key, rows }))
      )
    ),
    mergeMap(({ rows }, i) => {
      // TODO: Figure out a good way to distribute the orders to the distribution centers.
      const distributionCenters = [
        'Pålhagsvägen 4, Södertälje',
        'Bovallsvägen 5, 152 42 Södertälje',
      ]

      return searchOne(
        distributionCenters[i % distributionCenters.length]
      ).then(({ name, position }) =>
        rows.map((row) => ({ pickup: { name, position }, ...row }))
      )
    }, 1),
    mergeAll(),
    map((row) => new Booking({ type: 'parcel', ...row })),
    toArray(),

    map((bookings) => {
      console.log('TELGE -> bookings', bookings.length)
      return bookings
    }),
    mergeAll(),
    catchError((err) => {
      error('TELGE -> from CSV', err)
    }),
    shareReplay()
  )
}

module.exports = read()
