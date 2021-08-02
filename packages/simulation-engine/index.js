const { from, shareReplay } = require('rxjs')
const { mergeMap, take, filter, tap } = require('rxjs/operators')

const { generateBookingsInKommun } = require('./simulator/bookings')
const { generateCarsInKommun } = require('./simulator/cars')
const { dispatch } = require('./simulator/dispatchCentral')
const kommuner = require('./streams/kommuner')
const postombud = require('./streams/postombud')
const volumePackages = require('./streams/volumePackages')

const WORKING_DAYS = 200
const pilots = kommuner.pipe(filter((kommun) =>
  ['Arjeplog', 'Pajala', 'Storuman', 'Västervik', 'Ljusdal'].some((pilot) =>
    kommun.name.startsWith(pilot)
  )
))

const dispatchedBookings = pilots.pipe(mergeMap((kommun) => dispatch(kommun.cars, kommun.bookings)))

const engine = (module.exports = {
  bookings: pilots.pipe(
    mergeMap((kommun) =>
      generateBookingsInKommun(kommun.name).pipe(
        take(Math.ceil(kommun.packages.total / WORKING_DAYS)), // how many bookings do we want?
        tap((booking) => kommun.unhandledBookings.next(booking))
      )
    ),
    shareReplay(200)
  ),
  cars: pilots.pipe(
    mergeMap((kommun) => generateCarsInKommun(kommun, 10).pipe(
      tap((car) => kommun.cars.next(car))
    )),
  ),
  dispatchedBookings,
  volumePackages,
  postombud,
  kommuner,
})

