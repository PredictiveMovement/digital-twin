const { defer, shareReplay } = require('rxjs')
const { mergeMap, concatMap, take } = require('rxjs/operators')

const { generateBookingsInKommun } = require('./simulator/bookings')
const { generateCarsInKommun } = require('./simulator/cars')
const kommuner = require('./streams/kommuner')
const postombud = require('./streams/postombud')
const volumePackages = require('./streams/volumePackages')

const WORKING_DAYS = 200

const engine = module.exports = {
  bookings: kommuner.pipe(
    concatMap((kommun) =>
      generateBookingsInKommun(kommun.name).pipe(take(Math.ceil(kommun.packages.total / WORKING_DAYS / 24 / 60)))
    ),
    shareReplay(200)
  ),
  cars: generateCarsInKommun('Arjeplog', 1000),
  volumePackages,
  postombud,
  kommuner,
}

engine.bookings.subscribe(booking => console.log('booking', booking))