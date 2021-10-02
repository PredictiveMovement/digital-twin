const { from, range, concatAll, expand, shareReplay, of } = require('rxjs')
const {
  map,
  tap,
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

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })

// generate a pattern of random positions so we can take x out of these and get a natural pattern of these positions
const randomPositions = perlin
  .generatePerlinNoise(100, 100)
  // .generatePerlinNoise(1, 1)
  .map((probability, i) => ({ x: xy(i).x * 10, y: xy(i).y * 10, probability }))
  .sort((a, b) => b.probability - a.probability) // sort them so we can just pick how many we want

function generateBookingsInKommun(kommun) {
  console.log(`*** generateBookingsInKommun ${kommun.name}`)
  // a square is a km2 box with a population total. We will here populate each square with nearest postombud
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
    ),
  )

  const randomPointsInSquares = squaresWithNearestPostombud.pipe(
    // generate points in random patterns within each square
    mergeMap(({ population, nearestOmbud, position }) =>
      randomPositions
        .slice(0, population) // one address per person in this square km2
        .map(({ x, y }) => addMeters(position, { x, y }))
        .map((position) => ({ nearestOmbud, position }))
    ),
    tap(s => `randomInPointInSquares ${kommun.name}`)
  )

  const bookings = randomPointsInSquares.pipe(
    toArray(), // convert to array to be able to sort the addresses
    mergeMap((a) => from(a.sort((p) => Math.random() - 0.5))),
    mergeMap(({ nearestOmbud, position}) => kommun.fleets.pipe(
      first(fleet => nearestOmbud.operator.startsWith(fleet.name), null), // Find DHL_Express or DHL_Freight from DHL
      mergeMap(fleet => fleet ? of(fleet) : kommun.fleets.pipe(first())), // TODO: defaultIfEmpty
      map(fleet => ({ nearestOmbud, position, fleet})))
    ),
    mergeMap(({ nearestOmbud, position, fleet }) => {
      return pelias.nearest(position)
        .then((address) => {
          const isCommercial = address.layer === 'venue'
          const homeDelivery = Math.random() > fleet.percentageHomeDelivery
          const returnDelivery = Math.random() > fleet.percentageReturnDelivery

          if (isCommercial || homeDelivery) return new Booking({pickup: fleet.hub, destination: address})
          if (returnDelivery) return new Booking({pickup: nearestOmbud, destination: hub})

          return new Booking({
            pickup:  fleet.hub,
            destination: nearestOmbud,
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
    filter(p => p !== null),
    //retry(5)
  )
  return bookings
}

module.exports = { generateBookingsInKommun }

// kommuner.pipe(
//   first(k => k.name.startsWith('Arjeplog')),
//   mergeMap(k => generateBookingsInKommun(k))
// ).subscribe(booking => console.dir(booking))
