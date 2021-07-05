const { zip } = require('rxjs')
const { filter, mergeMap, bufferCount, mergeAll, mergeWith } = require('rxjs/operators')
const pink_bookings$ = require('./lib/streams/bookings')('pink')
const red_bookings$ = require('./lib/streams/bookings')('red')
const pink_company = require('./lib/distributors/pink_company')
const red_company = require('./lib/distributors/red_company')

const pink$ = zip(pink_bookings$, pink_company.join$).pipe(
  mergeMap(([booking, car]) => {
    return car.handleBookings([booking], 0)
  })
)

const red$ = zip(red_bookings$, red_company.join$).pipe(
  mergeMap(([booking, car]) => {
    return car.handleBookings([booking], 0)
  })
)

pink$.pipe(mergeWith(red$)).pipe(
  filter(event => event.type !== 'car:position')
)
  .subscribe(event => console.log(event))

pink_company.start()
red_company.start()