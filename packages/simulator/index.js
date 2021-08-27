const { shareReplay, share, merge, from, fromEvent, of } = require('rxjs')
const { map, mergeMap, concatAll, take, filter, tap, toArray } = require('rxjs/operators')

const { generateBookingsInKommun } = require('./simulator/bookings')
const { generateCars } = require('./simulator/cars')
const { dispatch } = require('./simulator/dispatchCentral')
const { virtualTime } = require('./lib/virtualTime')

const kommuner = require('./streams/kommuner')
const postombud = require('./streams/postombud')

const fs = require('fs')
const Booking = require('./lib/booking')

const { info } = require('./lib/log')

const WORKING_DAYS = 265
const NR_CARS = 7
const pilots = kommuner.pipe(
  filter((kommun) =>
    ['Arjeplog', 'Pajala', 'Storuman', 'Västervik', 'Ljusdal'].some((pilot) =>
    //['Storuman'].some((pilot) =>
      kommun.name.startsWith(pilot)
    ),
  ),
  shareReplay()
)

const engine = {
  virtualTime,
  bookings: pilots.pipe(
    // TODO: Dela upp och gör mer läsbart
    map((kommun) => {
      const file = __dirname + `/data/pm_bookings_${kommun.id}.json`
      let bookings
      if (fs.existsSync(file)) {
        console.log(`*** ${kommun.name}: bookings from cache (${file})`)
        bookings = from(JSON.parse(fs.readFileSync(file))).pipe(
          map(b => new Booking(b))
        )
      } else {
        console.log(`*** ${kommun.name}: no cached bookings`)
        bookings = generateBookingsInKommun(kommun).pipe(
          take(Math.ceil(kommun.packageVolumes.B2C / WORKING_DAYS)), // how many bookings do we want?
        )

        // TODO: Could we do this without converting to an array? Yes. By using fs stream and write json per line
        bookings.pipe(
          map(({id, pickup, destination}) => ({id, pickup, destination})), // remove all unneccessary data such as car and eventemitter etc
          toArray(),
        ).subscribe(arr => {
          fs.writeFileSync(file, JSON.stringify(arr))
          console.log(`*** ${kommun.name}: wrote bookings to cache (${file})`)
        })
      }


      return bookings.pipe(
        tap((booking) => {
          booking.kommun = kommun
          kommun.unhandledBookings.next(booking)
          kommun.bookings.next(booking)
        }),
      )
    }),

    concatAll(),
    shareReplay(),
  ),
  cars: pilots.pipe(
    mergeMap(kommun => {
      return kommun.postombud.pipe(
        map(ombud => ombud.position),
        toArray(),
        mergeMap((postombud) => generateCars(kommun.fleets, postombud, NR_CARS).pipe(
          tap((car) => {
            kommun.cars.next(car)
          })
        )),
      )
    }),
    shareReplay()
  ),
  dispatchedBookings: pilots.pipe(
    // TODO: add more than one dispatch central in each kommun = multiple fleets
    mergeMap((kommun) => {
      console.log('dispatching')
      return dispatch(kommun.cars, kommun.unhandledBookings)
    })
  ),
  postombud,
  kommuner
}

// Add these separate streams here so we don't have to register more than one event listener per booking and car
engine.bookingUpdates = engine.bookings.pipe(
  mergeMap(booking => merge(of(booking), fromEvent(booking, 'queued'), fromEvent(booking, 'pickedup'), fromEvent(booking, 'assigned'), fromEvent(booking, 'delivered'),)),
  shareReplay(1000),
)

engine.carUpdates = engine.cars.pipe(
  mergeMap((car) => fromEvent(car, 'moved')),
  share()
)


// engine.bookings.subscribe(booking => console.log('b', booking.id)) 
//engine.cars.subscribe(car => console.log('c', car.id))

// engine.kommuner.pipe(
//   mergeMap(kommun => kommun.bookings)
// ).subscribe(e => console.log('kb', ))

engine.dispatchedBookings
  .subscribe(({ car, booking }) => info(`Booking ${booking.id} dispatched to car ${car.id}`))
/*bookings.pipe(
  groupBy(kommun => kommun.id),
  mergeMap(group => fs.writeSync(group.key + '.json', group.pipe(toArray(), ))), // [id, [array]]
*/


// I strongly advice NOT to use the code:
process.setMaxListeners(0)

module.exports = engine