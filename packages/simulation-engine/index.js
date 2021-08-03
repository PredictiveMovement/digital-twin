const { from, shareReplay } = require('rxjs')
const { mergeMap, concatMap, take, filter, tap, share } = require('rxjs/operators')

const { generateBookingsInKommun } = require('./simulator/bookings')
const { generateCarsInKommun } = require('./simulator/cars')
const { dispatch } = require('./simulator/dispatchCentral')
const kommuner = require('./streams/kommuner')
const postombud = require('./streams/postombud')

const WORKING_DAYS = 200
const pilots = kommuner.pipe(
  filter((kommun) =>
    ['Arjeplog', 'Pajala', 'Storuman', 'Västervik', 'Ljusdal'].some((pilot) =>
      kommun.name.startsWith(pilot)
    ),
  ),
  shareReplay()
)

const dispatchedBookings = pilots.pipe(mergeMap((kommun) => dispatch(kommun.cars, kommun.unhandledBookings)))

const engine = {
  bookings: pilots.pipe(
    mergeMap((kommun) => 
      generateBookingsInKommun(kommun).pipe(
        take(Math.ceil(kommun.packageVolumes.B2C / WORKING_DAYS)), // how many bookings do we want?
        tap((booking) => {
          kommun.unhandledBookings.next(booking)
          kommun.bookings.next(booking)
        }),
        // tap(() => kommun.emit('update', kommun) )
      )
    ),
    shareReplay()
  ),
  cars: pilots.pipe(
    mergeMap((kommun) => generateCarsInKommun(kommun, 10).pipe(
      tap((car) => {
        console.log('*** adding car to kommun', car.id)
        kommun.cars.next(car)
      })
    )),
  ),
  dispatchedBookings,
  postombud,
  kommuner
}


// engine.bookings.subscribe(booking => console.log('b', booking.id)) 
//engine.cars.subscribe(car => console.log('c', car.id))

// engine.kommuner.pipe(
//   mergeMap(kommun => kommun.bookings)
// ).subscribe(e => console.log('kb', ))

dispatchedBookings.subscribe(({car, booking}) => console.log('*** booking dispatched', car.id, booking.id))

module.exports = engine