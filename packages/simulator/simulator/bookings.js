const { from, range, concatAll, expand, shareReplay, of } = require('rxjs')
const getDirName = require('path').dirname
const fs = require('fs')
const {
  map,
  tap,
  take,
  filter,
  first,
  concatMap,
  mergeMap,
  mergeAll,
  toArray,
} = require('rxjs/operators')
const pelias = require('../lib/pelias')
const { isInsideCoordinates } = require('../lib/polygon')
const { haversine, addMeters, convertPosition } = require('../lib/distance')
const perlin = require('perlin-noise')
const Booking = require('../lib/booking')
const Car = require('../lib/vehicles/car')

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })

// generate a pattern of random positions so we can take x out of these and get a natural pattern of these positions
const randomPositions = perlin
  .generatePerlinNoise(100, 100)
  // .generatePerlinNoise(1, 1)
  .map((probability, i) => ({ x: xy(i).x * 10, y: xy(i).y * 10, probability }))
  .sort((a, b) => b.probability - a.probability) // sort them so we can just pick how many we want

function getBookings(kommun) {
  const file = __dirname + `/../.cache/pm_bookings_${kommun.id}.json`
  let bookings
  if (fs.existsSync(file)) {
    console.log(`*** ${kommun.name}: bookings from cache (${file})`)
    bookings = from(JSON.parse(fs.readFileSync(file))).pipe(
      map((b) => new Booking(b))
    )
  } else {
    // https://www.trafa.se/globalassets/rapporter/2010-2015/2015/rapport-2015_12-lastbilars-klimateffektivitet-och-utslapp.pdf
    const WORKING_DAYS = 220
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
              (finalDestination && { position: finalDestination }) || undefined,
            destination: { position: destination, name },
          })
        ), // remove all unneccessary data such as car and eventemitter etc
        //tap(console.log),
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
}

function generateBookingsInKommun(kommun) {
  // console.log(`*** generateBookingsInKommun ${kommun.name}`)
  // // a square is a km2 box with a population total. We will here populate each square with nearest postombud
  const squaresWithNearestPostombud = kommun.squares.pipe(
    mergeMap((square) =>
      kommun.postombud.pipe(
        map((ombud) => ({
          ...ombud,
          distance: haversine(ombud.position, square.position),
        })),
        toArray(),
        map((ombud) => ombud.sort((a, b) => a.distance - b.distance).shift()),
        map((nearestOmbud) => ({ ...square, nearestOmbud }))
      )
    )
  )

  const randomPointsInSquares = squaresWithNearestPostombud.pipe(
    // generate points in random patterns within each square
    mergeMap(({ population, nearestOmbud, position }) =>
      randomPositions
        .slice(0, population) // one address per person in this square km2
        .map(({ x, y }) => addMeters(position, { x, y }))
        .map((position) => ({ nearestOmbud, position }))
    ),
    tap((s) => `randomInPointInSquares ${kommun.name}`)
  )

  const bookings = randomPointsInSquares.pipe(
    toArray(), // convert to array to be able to sort the addresses
    mergeMap((a) => from(a.sort((p) => Math.random() - 0.5))),
    mergeMap(({ nearestOmbud, position }) =>
      kommun.fleets.pipe(
        first((fleet) => nearestOmbud.operator.startsWith(fleet.name), null), // Find DHL_Express or DHL_Freight from DHL
        mergeMap((fleet) => (fleet ? of(fleet) : kommun.fleets.pipe(first()))), // TODO: defaultIfEmpty
        map((fleet) => ({ nearestOmbud, position, fleet }))
      )
    ),
    mergeMap(({ nearestOmbud, position, fleet }) => {
      return pelias
        .nearest(position)
        .then((address) => {
          const isCommercial = address.layer === 'venue'
          const homeDelivery = Math.random() < fleet.percentageHomeDelivery
          const returnDelivery = Math.random() < fleet.percentageReturnDelivery

          if (isCommercial || homeDelivery)
            return new Booking({
              pickup: fleet.hub,
              destination: address,
              origin: fleet.name,
            })
          if (returnDelivery)
            return new Booking({
              pickup: nearestOmbud,
              destination: hub,
              origin: fleet.name,
            })

          return new Booking({
            pickup: fleet.hub,
            destination: nearestOmbud,
            finalDestination: address,
            origin: fleet.name,
          })
        })
        .catch(() => Promise.resolve(null))
    }, 1),
    /*tap(booking => {
      booking.on('delivered', booking => {
        console.log('relaying booking to its final destination')
        if (booking.destination !== booking.finalDestination) {
          booking.destination = booking.finalDestination
          kommun.unhandledBookings.next(booking)
        }
      })
    }),*/
    //expand(({isCommercial}) => Math.ceil(Math.random() * (isCommercial ? 100 : 2))),
    filter((p) => p !== null)
    //retry(5)
  )
  return bookings
}

module.exports = { getBookings }

// kommuner.pipe(
//   first(k => k.name.startsWith('Arjeplog')),
//   mergeMap(k => generateBookingsInKommun(k))
// ).subscribe(booking => console.dir(booking))
