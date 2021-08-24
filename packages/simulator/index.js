const { shareReplay, from } = require('rxjs')
const { map, mergeMap, concatAll, take, filter, tap, toArray, zipWith } = require('rxjs/operators')

const { generateBookingsInKommun } = require('./simulator/bookings')
const { generateCars } = require('./simulator/cars')
const { dispatch } = require('./simulator/dispatchCentral')
const kommuner = require('./streams/kommuner')
const postombud = require('./streams/postombud')

const { distributeNumberOfBookingsOverDays } = require('./lib/orderDistribution')

const fs = require('fs')
const Booking = require('./lib/booking')

const { info } = require('./lib/log')

const PERLIN_NOISE_OPTIONS = {
  width: 53,
  height: 10,
  options: {
    amplitude: 0.9,
    octaveCount: 1,
    persistence: 0.1,
  }
}

const WORKING_DAYS = 265
const NR_CARS = 7
const pilots = kommuner.pipe(
  filter((kommun) =>
    ['Arjeplog'].some((pilot) =>
      kommun.name.startsWith(pilot)
    ),
  ),
  shareReplay()
)

const distributionOfOrders = kommuner.pipe(
  filter((kommun) =>
    ['Arjeplog'].some((pilot) =>
      kommun.name.startsWith(pilot)
    ),
  ),
  map(kommun => {
    console.log('HELLO?')
    let r = []
    r[kommun.name] = distributeNumberOfBookingsOverDays(WORKING_DAYS, kommun.packageVolumes.B2C, PERLIN_NOISE_OPTIONS)
    return r
  }),
  tap(data => {
    console.log('DISTRIBUTION', data)
  }),
  toArray(),
  // orderDistribution[kommun][currentDayIndex]
  // orderDistribution[currentDayIndex]
  shareReplay()
)
// TODO 
distributionOfOrders.subscribe()



let currentDayIndex = 0

const engine = {
  bookings: pilots.pipe(
    // TODO: Dela upp och gör mer läsbart
    map((kommun) => {
      const file = `/tmp/pm_bookings_${kommun.id}.json`
      let bookings
      if (fs.existsSync(file)) {
        console.log(`*** ${kommun.name}: bookings from cache (${file})`)
        bookings = from(JSON.parse(fs.readFileSync(file))).pipe(
          map(b => new Booking(b))
        )
      } else {
        console.log(`*** ${kommun.name}: no cached bookings`)

        // assuming each call of the function is the next day/getting bookings for the next day
        currentDayIndex += 1
        if (currentDayIndex > WORKING_DAYS) {
          currentDayIndex = 0
        }

        // console.log('hello...')
        // console.log(distributionOfOrders)
        // distributionOfOrders.pipe(
        //   tap(d => {
        //     console.log('data', d)
        //   })
        // )

        distributionOfOrders.map(
          map(d => {
            console.log('meow', d)
          })
        )

        bookings = generateBookingsInKommun(kommun).pipe(
          /*
          zipWith(distributionOfOrders),
          map(([bookings, distribution]) => {
            tap((data) => {
              console.log(data)
            })
          }),
          */
          // take(Math.ceil(kommun.packageVolumes.B2C / WORKING_DAYS)), // how many bookings do we want?
          tap((kommun) => console.log(distributionOfOrders[kommun.name][currentDayIndex]))
          // take(distributeNumberOfBookingsOverDays(WORKING_DAYS, kommun.packageVolumes.B2C, PERLIN_NOISE_OPTIONS)[currentDayIndex])
        )

        // TODO: Could we do this without converting to an array?
        bookings.pipe(
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