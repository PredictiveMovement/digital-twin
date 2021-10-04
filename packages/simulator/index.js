const { shareReplay, share, merge, from, fromEvent, of } = require('rxjs')
const { map, mergeMap, concatAll, take, filter, tap, toArray, mergeAll, catchError } = require('rxjs/operators')

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
        take(Math.ceil(kommun.packageVolumes?.total / WORKING_DAYS)), // how many bookings do we want?
        //take(10)
      )

      // TODO: Could we do this without converting to an array? Yes. By using fs stream and write json per line
      bookings.pipe(
        map(({ id, origin, pickup: {position: pickup}, destination: {position: destination}}) => ({ id, origin, pickup: {position: pickup}, destination: {position: destination} })), // remove all unneccessary data such as car and eventemitter etc
        toArray(),
      ).subscribe(arr => {
        fs.writeFileSync(file, JSON.stringify(arr))
        console.log(`*** ${kommun.name}: wrote bookings to cache (${file})`)
      })
    }
    bookings.subscribe(booking => kommun.handleBooking(booking))
    return kommun
  })
)

const engine = {
  virtualTime,
  cars: pilots.pipe(
    mergeMap(kommun => kommun.cars),
    shareReplay(),
  ),
  dispatchedBookings: pilots.pipe(
    mergeMap((kommun) => kommun.dispatchedBookings),
    shareReplay(),
  ),
  postombud,
  kommuner
}

// Add these separate streams here so we don't have to register more than one event listener per booking and car
engine.bookingUpdates = engine.dispatchedBookings.pipe(
  mergeMap(booking => merge(of(booking), fromEvent(booking, 'queued'), fromEvent(booking, 'pickedup'), fromEvent(booking, 'assigned'), fromEvent(booking, 'delivered'),)),
  share(),
)

engine.carUpdates = engine.cars.pipe(
  mergeMap((car) => fromEvent(car, 'moved')),
  share()
)

engine.dispatchedBookings
  .subscribe((booking) => info(`Booking ${booking?.id} dispatched to fleet ${booking?.fleet?.name}`))

// TODO: see if we can remove this
process.setMaxListeners(0)

module.exports = engine