const { zip } = require('rxjs')
const { mergeMap, bufferCount, mergeAll } = require('rxjs/operators')
const bookings$ = require('./lib/streams/bookings')
const pink_company = require('./lib/distributors/pink_company')
const red_company = require('./lib/distributors/red_company')


zip(
  // bookings$.pipe(map(b => [b])), // convert booking to array
  bookings$.pipe(bufferCount(2)),

  zip(
    pink_company.join$,
    red_company.join$
  ).pipe(
    mergeAll()
  )
)
  .pipe(
    mergeMap(([bookings, car]) => {
      return car.handleBookings(bookings, 0)
    }),
  )
  .forEach(event => {
    // console.log(JSON.stringify(event, null, 0))
  })


pink_company.start()
red_company.start()