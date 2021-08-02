const { from, shareReplay } = require('rxjs')
const { mergeMap, take, filter, tap } = require('rxjs/operators')

const { generateBookingsInKommun } = require('./simulator/bookings')
const { generateCarsInKommun } = require('./simulator/cars')
const kommuner = require('./streams/kommuner')
const postombud = require('./streams/postombud')
const volumePackages = require('./streams/volumePackages')

const WORKING_DAYS = 200
const pilots = ['Arjeplog', 'Pajala', 'Storuman', 'Västervik', 'Ljusdal']

const engine = (module.exports = {
  bookings: kommuner.pipe(
    filter(kommun => pilots.some(name => kommun.name.startsWith(name))),
    mergeMap((kommun) =>
      generateBookingsInKommun(kommun.name).pipe(
        take(Math.ceil(kommun.packages.total / WORKING_DAYS)), // how many bookings do we want?
        tap(booking => kommun.unhandledBookings.next(booking))
      )
    ),
    shareReplay(200)
  ),
  cars: kommuner.pipe(
    filter(kommun => pilots.some(name => kommun.name.startsWith(name))),
    mergeMap((kommun) => generateCarsInKommun(kommun, 10)),
  ),
  volumePackages,
  postombud,
  kommuner,
})

engine.bookings.subscribe((booking) => console.log('booking', booking))
