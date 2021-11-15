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

// https://www.trafa.se/globalassets/rapporter/2010-2015/2015/rapport-2015_12-lastbilars-klimateffektivitet-och-utslapp.pdf
const WORKING_DAYS = 220
const pilots = kommuner.pipe(
  filter((kommun) =>
    //['Arjeplog', 'Arvidsjaur', 'Pajala', 'Storuman', 'Västervik', 'Ljusdal'].some((pilot) =>
    ['Arjeplog', 'Arvidsjaur', 'Pajala', 'Storuman', 'Västervik', 'Ljusdal'].some((pilot) =>
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
        map(({ id, origin, pickup: {position: pickup}, finalDestination: {position: finalDestination} = {}, destination: {position: destination, name}}) => ({ id, origin, pickup: {position: pickup}, finalDestination: finalDestination && {position: finalDestination} || undefined, destination: {position: destination, name} })), // remove all unneccessary data such as car and eventemitter etc
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
  vehicles: pilots.pipe(
    mergeMap(kommun => kommun.vehicles),
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

engine.vehicleUpdates = engine.vehicles.pipe(
  mergeMap((vehicle) => fromEvent(vehicle, 'moved')),
  share()
)

engine.dispatchedBookings
  .subscribe((booking) => info(`Booking ${booking?.id} dispatched to fleet ${booking?.fleet?.name}`))

// TODO: see if we can remove this
process.setMaxListeners(0)

module.exports = engine