const { from, shareReplay, filter } = require('rxjs')
const {
  map,
  toArray,
  mergeMap,
  take,
  groupBy,
  mergeAll,
} = require('rxjs/operators')
const moment = require('moment')
const { readCsv } = require('../../adapters/csv')
const { default: fetch } = require('node-fetch')
const { search } = require('../../lib/pelias')
const Position = require('../../lib/models/position')
const Booking = require('../../lib/models/booking')

const origins = {
  CDC031: {
    name: 'Iteam Solutions',
  },
  CDC405: {
    name: 'Iteam Solutions',
  },
  STO012: {
    name: 'Ikea Kungens Kurva',
  },
  STO014: {
    name: 'Ikea Kållered',
  },
  STO017: {
    name: 'Ikea Linköping',
  },
  STO445: {
    name: 'Ikea Malmö',
  },
  STO468: {
    name: 'Ikea Helsingborg',
  },
  STO469: {
    name: 'Ikea Kalmar',
  },
  SUP22216: {
    name: 'Iteam Solutions',
  },
  SUP22677: {
    name: 'Iteam Solutions',
  },
  SUP22844: {
    name: 'Iteam Solutions',
  },
  SUP23329: {
    name: 'Iteam Solutions',
  },
  SUP50029: {
    name: 'Iteam Solutions',
  },
  None: {
    name: 'Iteam Solutions',
  },
}

function read() {
  return from(readCsv(process.cwd() + '/data/helsingborg/ikea.csv')).pipe(
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
        created,
        volume,
        weight,
        length,
      })
    ),
    filter((row) => moment(row.created).isSame('2022-09-17', 'day')),
    groupBy((row) => row.deliveryZip),
    mergeMap((group) =>
      group.pipe(
        toArray(),
        map((rows) => ({ key: group.key, rows }))
      )
    ),
    mergeMap(
      ({ key, rows }) =>
        fetch(
          `https://streams.predictivemovement.se/addresses/zip/${key}?size=${rows.length}`
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
        search(origins[key].name).then(({ name, position }) =>
          rows.map((row) => ({ pickup: { name, position }, ...row }))
        ),
      1
    ),
    mergeAll(),
    map((row) => new Booking(row)),
    shareReplay()
  )
}

module.exports = read()
