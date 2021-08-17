const { shareReplay, timer, from } = require('rxjs')
const { map, mergeMap, concatAll, concatMap, take, filter, tap, toArray, takeUntil } = require('rxjs/operators')

const { generateBookingsInKommun } = require('./simulator/bookings')
const { generateCars } = require('./simulator/cars')
const { dispatch } = require('./simulator/dispatchCentral')
const kommuner = require('./streams/kommuner')
const postombud = require('./streams/postombud')

const fs = require('fs')
const Booking = require('./lib/booking')

const WORKING_DAYS = 265
const NR_CARS = 15
const pilots = kommuner.pipe(
  filter((kommun) =>
    // ['Stockholm', 'Arjeplog', 'Pajala', 'Storuman', 'Västervik', 'Ljusdal'].some((pilot) =>
    ['Storuman'].some(pilot =>
      kommun.name.startsWith(pilot)
    ),
  ),
  shareReplay()
)


const engine = {
  bookings: pilots.pipe(
    map((kommun) => {
      const file = `data/bookings_${kommun.id}.json`
      console.log(file)
  
      let bookings
      if (fs.existsSync(file)) {
        console.log('*** loading cached bookings from json')
        const content = JSON.parse(fs.readFileSync(file))
        bookings = from(content).pipe(
          map(data => new Booking(data))
        )
      } else {
        bookings = generateBookingsInKommun(kommun).pipe(
          take(Math.ceil(kommun.packageVolumes.B2C / WORKING_DAYS)), // how many bookings do we want?
        )
      }
  
      return bookings.pipe(
        tap((booking) => {
          // console.log(`*** adding booking to ${kommun.name}`)
          booking.kommun = kommun
          kommun.unhandledBookings.next(booking)
          kommun.bookings.next(booking)
        }),
        // tap(() => kommun.emit('update', kommun) )
      )
    }),
    
    concatAll(),
    // map(booking => ({
    //   id: booking.id,
    //   pickup: booking.pickup,
    //   isCommercial: booking.isCommercial,
    //   destination: booking.destination,
    //   status: booking.status,
    // })),
    // toArray(),
    // tap(data => {
    //   console.log(data)
    //   fs.writeFileSync('data/storuman.json', JSON.stringify(data))
    // })
    shareReplay(),
  ),
  cars: pilots.pipe(
    mergeMap(kommun => {
      return kommun.postombud.pipe(
        map(ombud => ombud.position),
        toArray(),
        mergeMap((postombud) => generateCars(postombud, NR_CARS).pipe(
          tap((car) => {
            // console.log(`*** adding car to kommun ${kommun.name} #${car.id}`)
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

engine.dispatchedBookings.subscribe(({car, booking}) => console.log('*** booking dispatched (car, booking):', car.id, car.queue.length, booking.id))

module.exports = engine