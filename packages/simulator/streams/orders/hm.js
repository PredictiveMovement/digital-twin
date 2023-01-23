const { from, shareReplay, filter, of } = require('rxjs')
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
  bufferTime,
} = require('rxjs/operators')
const moment = require('moment')
const { readCsv } = require('../../adapters/csv')
const { default: fetch } = require('node-fetch')
const { search } = require('../../lib/pelias')
const Position = require('../../lib/models/position')
const Booking = require('../../lib/models/booking')
const { error } = require('../../lib/log')

const importOrigins = ['poznan, pl', 'tilburg, nl']

function read() {
  // eslint-disable-next-line no-undef
  return from(readCsv(process.cwd() + '/data/helsingborg/hm.csv')).pipe(
    map(
      ({
        CustomerOrderNumber: id,
        Pieces: quantity,
        ZipCode: deliveryZip,
        ShippedDate: deliveryDate,
        WarehouseCode: origin,
        ShippedDate: created,
        Weight: weight,
      }) => ({
        id,
        quantity: +quantity,
        deliveryZip,
        deliveryDate: moment(deliveryDate, 'YYYY/MM/DD HH:mm').valueOf(),
        origin,
        sender: 'H&M',
        created: moment(created, 'YYYY/MM/DD HH:mm').valueOf(),
        weight: weight / 1000, // g -> kg
      })
    ),
    filter((row) => moment(row.created).isSame('2022-09-07', 'day')),
    filter((hm) => hm.deliveryZip),
    groupBy((row) => row.id),
    mergeMap((group) =>
      group.pipe(
        toArray(),
        map((rows) => ({ key: group.key, rows }))
      )
    ),
    mergeMap(
      ({ key, rows }) =>
        fetch(
          `https://streams.predictivemovement.se/addresses/zip/${rows[0].deliveryZip}?size=1&seed=${key}`
        )
          .then((res) => res.json())
          .then((addresses) =>
            addresses.map(({ address, position }, i) => ({
              destination: { address, position: new Position(position) },
              ...rows[i],
            }))
          ),
      5
    ),
    retryWhen((errors) =>
      errors.pipe(
        tap((err) => error('Zip streams error, retrying in 1s...', err)),
        delay(1000)
      )
    ),
    catchError((err) => {
      error('HM -> from CSV', err)
      return of({})
    }),
    mergeAll(),
    groupBy((row) => row.origin),
    mergeMap((group) =>
      group.pipe(
        toArray(),
        map((rows) => ({ key: group.key, rows }))
      )
    ),
    mergeMap(({ key, rows }, i) => {
      // TODO: Figure out a good way to distribute the orders to the distribution centers.
      const distributionCenters = [
        'Mineralgatan 5, Helsingborg', // PostNord.
        'Brunkalundsvägen 4, Helsingborg', // Schenker.
        'Trintegatan 10, Helsingborg', // DHL.
        'Strandbadsvägen 7, Helsingborg', // TNT.
      ]

      let pickup = key
      if (importOrigins.includes(key.toLowerCase().trim())) {
        pickup = distributionCenters[i % 4] // TODO: Improve handling of origins outside of Sweden.
      }

      return search(distributionCenters[i % 4]).then(({ name, position }) =>
        rows.map((row) => ({ pickup: { name, position }, ...row }))
      )
    }, 1),
    retryWhen((errors) =>
      errors.pipe(
        tap((err) => error('Pelias error, retrying in 1s...', err)),
        delay(1000)
      )
    ),
    mergeAll(1),
    map((row) => new Booking(row)),
    catchError((err) => {
      error('HM -> from CSV', err)
    }),
    shareReplay()
  )
}

module.exports = read()
