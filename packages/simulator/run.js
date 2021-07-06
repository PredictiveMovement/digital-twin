const { zip } = require('rxjs')
const { toArray, filter, mergeMap, bufferCount, mergeAll, mergeWith, count } = require('rxjs/operators')
const pink_bookings$ = require('./lib/streams/bookings')('pink')
const red_bookings$ = require('./lib/streams/bookings')('red')
const pink_company = require('./lib/distributors/pink_company')
// const red_company = require('./lib/distributors/red_company')

pink_bookings$.pipe(count()).subscribe(c => console.log(`${c} pink bookings`))

const pink$ = zip(pink_bookings$, pink_company.join$).pipe(
  mergeMap(([booking, car]) => {
    return car.handleBookings([booking], 0)
  })
)

// const red$ = zip(red_bookings$, red_company.join$).pipe(
//   mergeMap(([booking, car]) => {
//     return car.handleBookings([booking], 0)
//   })
// )

// const events$ = pink$.pipe(mergeWith(red$))
const events$ = pink$

let events = []
let bookings = []

events$.subscribe(e => events.push(e))

pink_bookings$
  // .pipe(mergeWith(red_bookings$))
  .subscribe(x => bookings.push(x))

module.exports = {
  events,
  bookings
}

// if (require.main === module) {
//   events$.pipe(
//     filter(event => event.type !== 'car:position')
//   )
//     .subscribe(event => console.log(event))
// }


pink_company.start()
// red_company.start()