const { shareReplay, share, merge, from, fromEvent, of } = require('rxjs')
const {
  map,
  mergeMap,
  concatAll,
  take,
  filter,
  tap,
  toArray,
  mergeAll,
  catchError,
} = require('rxjs/operators')

const { generateBookingsInKommun } = require('./simulator/bookings')
const { virtualTime } = require('./lib/virtualTime')
// TODO: replace this with a better statistical distribution

const postombud = require('./streams/postombud')
const { stops } = require('./streams/publicTransport')

const fs = require('fs')
const getDirName = require('path').dirname
const Booking = require('./lib/booking')

const { info } = require('./lib/log')
const { busDispatch } = require('./lib/busDispatch')

// https://www.trafa.se/globalassets/rapporter/2010-2015/2015/rapport-2015_12-lastbilars-klimateffektivitet-och-utslapp.pdf
const WORKING_DAYS = 220
const kommuner = require('./streams/kommuner').pipe(
  // TODO: Dela upp och gör mer läsbart
  map((kommun) => {
    const file = __dirname + `/.cache/pm_bookings_${kommun.id}.json`
    let bookings
    if (fs.existsSync(file)) {
      console.log(`*** ${kommun.name}: bookings from cache (${file})`)
      bookings = from(JSON.parse(fs.readFileSync(file))).pipe(
        map((b) => new Booking(b))
      )
    } else {
      console.log(`*** ${kommun.name}: no cached bookings`)
      bookings = generateBookingsInKommun(kommun).pipe(
        take(Math.ceil(kommun.packageVolumes?.total / WORKING_DAYS)) // how many bookings do we want?
      )

      // TODO: Could we do this without converting to an array? Yes. By using fs stream and write json per line
      bookings
        .pipe(
          map(
            ({
              id,
              origin,
              pickup: { position: pickup },
              finalDestination: { position: finalDestination } = {},
              destination: { position: destination, name },
            }) => ({
              id,
              origin,
              pickup: { position: pickup },
              finalDestination:
                (finalDestination && { position: finalDestination }) ||
                undefined,
              destination: { position: destination, name },
            })
          ), // remove all unneccessary data such as car and eventemitter etc
          toArray()
        )
        .subscribe((arr) => {
          fs.mkdir(getDirName(file), { recursive: true }, (err) => {
            if (err) {
              console.error(err)
              return
            }
            fs.writeFileSync(file, JSON.stringify(arr))
            console.log(`*** ${kommun.name}: wrote bookings to cache (${file})`)
          })
        })
    }
    bookings.subscribe((booking) => kommun.handleBooking(booking))
    return kommun
  }),
  shareReplay()
)

const engine = {
  virtualTime,
  cars: kommuner.pipe(
    mergeMap((kommun) => kommun.cars),
    shareReplay()
  ),
  dispatchedBookings: kommuner.pipe(
    mergeMap((kommun) => kommun.dispatchedBookings),
    shareReplay()
  ),
  busStartingPoints: kommuner.pipe(
    mergeMap((kommun) => kommun.busStartingPoints),
    shareReplay()
  ),
  buses: kommuner.pipe(
    mergeMap((kommun) => kommun.buses),
    shareReplay()
  ),
  busStops: stops.pipe(filter((stop) => !stop.station)),
  postombud,
  kommuner,
}

// Add these separate streams here so we don't have to register more than one event listener per booking and car
engine.bookingUpdates = engine.dispatchedBookings.pipe(
  mergeMap((booking) =>
    merge(
      of(booking),
      fromEvent(booking, 'queued'),
      fromEvent(booking, 'pickedup'),
      fromEvent(booking, 'assigned'),
      fromEvent(booking, 'delivered')
    )
  ),
  share()
)

engine.carUpdates = engine.cars.pipe(
  mergeMap((car) => fromEvent(car, 'moved')),
  // tap((car) => console.log(`*** ${car.id}: moved`)),
  share()
)

engine.dispatchedBookings.subscribe((booking) =>
  info(`Booking ${booking?.id} dispatched to fleet ${booking?.fleet?.name}`)
)

engine.dispatchedBuses = kommuner
  .pipe(mergeMap((kommun) => kommun.dispatchedBuses))
  .subscribe((plan) => console.log('received plan'))

// TODO: see if we can remove this
process.setMaxListeners(0)

module.exports = engine
