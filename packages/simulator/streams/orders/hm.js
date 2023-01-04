const { from, shareReplay, filter, of } = require('rxjs')
const {
  map,
  toArray,
  mergeMap,
  groupBy,
  mergeAll,
  catchError,
} = require('rxjs/operators')
const moment = require('moment')
const { readCsv } = require('../../adapters/csv')
const { default: fetch } = require('node-fetch')
const { search } = require('../../lib/pelias')
const Position = require('../../lib/models/position')
const Booking = require('../../lib/models/booking')
const { error } = require('../../lib/log')

function read() {
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
    filter((row) => moment(row.created).isSame('2022-09-05', 'day')),
    mergeMap((hmBooking) => {
      return fetch(
        `https://streams.predictivemovement.se/addresses/zip/${hmBooking.deliveryZip}?size=1&seed=${hmBooking.id}`
      )
        .then((res) => res.json())
        .then((addresses) => {
          const address = addresses[0]
          if (!address)
            throw new Error('No address found for ' + hmBooking.deliveryZip)
          return {
            destination: {
              address,
              position: new Position(address.position),
            },
            ...hmBooking,
          }
        })
    }),
    catchError((err) => {
      error('parse zip', err)
      return of({})
    }),
    filter((hm) => hm.destination),
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
    mergeAll(),
    groupBy((row) => row.origin),
    mergeMap((group) =>
      group.pipe(
        toArray(),
        map((rows) => ({ key: group.key, rows }))
      )
    ),
    mergeMap(
      ({ key, rows }) =>
        search(key).then(({ name, position }) =>
          rows.map((row) => ({ pickup: { name, position }, ...row }))
        ),
      1
    ),
    mergeAll(),
    map((row) => new Booking(row)),
    catchError((err) => {
      error('HM -> from CSV', err)
    }),
    shareReplay()
  )
}

module.exports = read()
