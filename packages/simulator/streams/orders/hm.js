const { from, shareReplay, filter } = require('rxjs')
const {
  map,
  toArray,
  mergeMap,
  groupBy,
  mergeAll,
  catchError,
  tap,
} = require('rxjs/operators')
const moment = require('moment')
const { readCsv } = require('../../adapters/csv')
const { default: fetch } = require('node-fetch')
const { search } = require('../../lib/pelias')
const Position = require('../../lib/models/position')
const Booking = require('../../lib/models/booking')
const { error } = require('../../lib/log')

const origins = {
  CDC031: {
    name: 'Norra Hamnen Malmö', // TODO: Get the right location.
  },
  CDC405: {
    name: 'Norra Hamnen Malmö', // TODO: Get the right location.
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
    name: 'Norra Hamnen Malmö', // TODO: Get the right location.
  },
  SUP22677: {
    name: 'Norra Hamnen Malmö', // TODO: Get the right location.
  },
  SUP22844: {
    name: 'Norra Hamnen Malmö', // TODO: Get the right location.
  },
  SUP23329: {
    name: 'Norra Hamnen Malmö', // TODO: Get the right location.
  },
  SUP50029: {
    name: 'Norra Hamnen Malmö', // TODO: Get the right location.
  },
  None: {
    name: 'Norra Hamnen Malmö', // TODO: Get the right location.
  },
}

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
        1: volume,
        Weight: weight,
        1: length,
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
    filter((row) => moment(row.created).isSame('2022/09/05', 'day')),
    mergeMap((hmBooking) => {
      return fetch(
        `https://streams.predictivemovement.se/addresses/zip/${hmBooking.deliveryZip}?size=1&seed=${hmBooking.id}`
      )
        .then((res) => res.json())
        .then((addresses) => {
          const address = addresses[0]
          return {
            destination: {
              address,
              position: new Position(address.position),
            },
            ...hmBooking,
          }
        })
    }),
    tap((aha) => {
      console.log('sssss', aha)
    }),
    // groupBy((row) => row.id),
    // mergeMap((group) =>
    //   group.pipe(
    //     toArray(),
    //     map((rows) => ({ key: group.key, rows }))
    //   )
    // ),
    // mergeMap(
    //   ({ key, rows }) =>
    //     fetch(
    //       `https://streams.predictivemovement.se/addresses/zip/${rows[0].deliveryZip}?size=1&seed=${key}`
    //     )
    //       .then((res) => res.json())
    //       .then((addresses) =>
    //         addresses.map(({ address, position }, i) => ({
    //           destination: { address, position: new Position(position) },
    //           ...rows[i],
    //         }))
    //       ),
    //   5
    // ),
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
    catchError((err) => {
      error('HM -> from CSV', err)
    }),
    tap((hm) => console.log(hm)),
    shareReplay()
  )
}

module.exports = read()