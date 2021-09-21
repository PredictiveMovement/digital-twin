const { shareReplay, share, merge, from, fromEvent, of } = require('rxjs')
const { map, mergeMap, concatAll, take, filter, tap, toArray, mergeAll } = require('rxjs/operators')

const { generateBookingsInKommun } = require('./simulator/bookings')
const { virtualTime } = require('./lib/virtualTime')
// TODO: replace this with a better statistical distribution

const kommuner = require('./streams/kommuner')
const postombud = require('./streams/postombud')

const fs = require('fs')
const Booking = require('./lib/booking')

const { info } = require('./lib/log')

const WORKING_DAYS = 265
const pilots = kommuner.pipe(
  filter((kommun) =>
    //['Arjeplog', 'Arvidsjaur', 'Pajala', 'Storuman', 'Västervik', 'Ljusdal'].some((pilot) =>
    ['Arjeplog', 'Pajala', 'Storuman', 'Västervik', 'Ljusdal'].some((pilot) =>
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
        tap((booking) => kommun.handleBooking(booking)),
      )
    }),

    concatAll(),
    shareReplay(),
  ),
  cars: pilots.pipe(
    map(kommun => kommun.cars),
    //concatAll(),
    mergeAll(),
    shareReplay(),
  ),
  dispatchedBookings: pilots.pipe(
    mergeMap((kommun) => kommun.dispatchedBookings)
  ),
  postombud,
  kommuner
}

// Add these separate streams here so we don't have to register more than one event listener per booking and car
engine.bookingUpdates = engine.bookings.pipe(
  mergeMap(booking => merge(of(booking), fromEvent(booking, 'queued'), fromEvent(booking, 'pickedup'), fromEvent(booking, 'assigned'), fromEvent(booking, 'delivered'),)),
  shareReplay(),
)

engine.carUpdates = engine.cars.pipe(
  tap(car => {
    console.log('EN BIL!', car)
  }),
  mergeAll(),
  mergeMap((car) => fromEvent(car, 'moved')),
  share()
)

engine.dispatchedBookings
  .subscribe((booking) => info(`Booking ${booking?.id} dispatched to fleet ${booking?.fleet?.name}`))

// TODO: see if we can remove this
process.setMaxListeners(0)

module.exports = engine