const { shareReplay } = require('rxjs')
const { map, mergeMap, concatMap, take, filter, tap, toArray } = require('rxjs/operators')

const { generateBookingsInKommun } = require('./simulator/bookings')
const { generateCars } = require('./simulator/cars')
const { dispatch } = require('./simulator/dispatchCentral')
const kommuner = require('./streams/kommuner')
const postombud = require('./streams/postombud')

const WORKING_DAYS = 200
const NR_CARS = 15
const pilots = kommuner.pipe(
  filter((kommun) =>
    ['Arjeplog', 'Storuman'].some((pilot) =>
      kommun.name.startsWith(pilot)
    ),
  ),
  shareReplay()
)

const engine = {
  bookings: pilots.pipe(
    concatMap((kommun) => 
      generateBookingsInKommun(kommun).pipe(
        take(Math.ceil(kommun.packageVolumes.B2C / WORKING_DAYS)), // how many bookings do we want?
        tap((booking) => {
          booking.kommun = kommun
          kommun.unhandledBookings.next(booking)
          kommun.bookings.next(booking)
        }),
        // tap(() => kommun.emit('update', kommun) )
      )
    ),
    shareReplay()
  ),
  cars: pilots.pipe(
    mergeMap(kommun => {
      return kommun.postombud.pipe(
        map(ombud => ombud.position),
        toArray(),
        concatMap((postombud) => generateCars(postombud.reverse(), NR_CARS).pipe(
          tap((car) => {
            console.log(`*** adding car to kommun ${kommun.name} #${car.id}`)
            kommun.cars.next(car)
          })
        )),
      )
    }, 10)
  ),
  dispatchedBookings: pilots.pipe(
    // TODO: add more than one dispatch central in each kommun = multiple fleets
    mergeMap((kommun) => dispatch(kommun.cars, kommun.unhandledBookings), 10)
  ),
  postombud,
  kommuner
}


// engine.bookings.subscribe(booking => console.log('b', booking.id)) 
//engine.cars.subscribe(car => console.log('c', car.id))

// engine.kommuner.pipe(
//   mergeMap(kommun => kommun.bookings)
// ).subscribe(e => console.log('kb', ))

engine.dispatchedBookings.subscribe(({car, booking}) => console.log('*** booking dispatched', booking.kommun.name, car.id, booking.id))

module.exports = engine