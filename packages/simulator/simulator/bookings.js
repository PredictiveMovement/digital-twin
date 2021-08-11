const { from, range, concatAll } = require('rxjs')
const {
  map,
  first,
  filter,
  retry,
  concatMap,
  mergeMap,
  toArray,
  mergeAll,
} = require('rxjs/operators')
const pelias = require('../lib/pelias')
const { isInsideCoordinates } = require('../lib/polygon')
const postombud = require('../streams/postombud')
const kommuner = require('../streams/kommuner')
const { haversine, addMeters } = require('../lib/distance')
const perlin = require('perlin-noise')
const Booking = require('../lib/booking')

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })
let id = 0

// generate a pattern of random positions so we can take x out of these and get a natural pattern of these positions
const randomPositions = perlin
  .generatePerlinNoise(100, 100)
  .map((probability, i) => ({ x: xy(i).x * 10, y: xy(i).y * 10, probability }))
  .sort((a, b) => b.probability - a.probability) // sort them so we can just pick how many we want

function generateBookingsInKommun(kommun) {
  // a square is a km2 box with a population total. We will here populate each square with nearest postombud
  const squaresWithNearestPostombud = kommun.squares.pipe(
    mergeMap((square) =>
      kommun.postombud.pipe(
        map((ombud) => ({
          ...ombud,
          distance: haversine(ombud.position, square.position),
        })),
        toArray(),
        map((ombud) => ombud.sort((a, b) => a.distance - b.distance).pop()),
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
  )

  const bookings = randomPointsInSquares.pipe(
    mergeMap((point) => kommun.commercialAreas.pipe(
      first(area => isInsideCoordinates(point.position, area.geometry.coordinates), false),
      map(commercialArea => ({...point, isCommercial: !!commercialArea } ))
    )),
    toArray(), // convert to array to be able to sort the addresses
    mergeMap((a) => from(a.sort((p) => Math.random() - 0.5 - (p.isCommercial ? 2 : 0)))),
    concatMap(({ nearestOmbud, position, isCommercial }) => {
      if (isCommercial) console.log('isCommercial', isCommercial)
      // add more than one booking if this point is within a commercial area
      const bookingsAtThisAdress = Math.ceil(Math.random() * (isCommercial ? 100 : 2)) // ? hur ska vi räkna en pall?
      return pelias
        .nearest(position)
        .then((address) => range(1, bookingsAtThisAdress).pipe(
          map(() => new Booking({
            id: id++,
            pickup: nearestOmbud,
            isCommercial: isCommercial || address.layer === 'venue',
            destination: address,
          }))
        ))
    }),
    mergeAll(),
    //retry(5)
  )
  return bookings
}

module.exports = { generateBookingsInKommun }

// kommuner.pipe(
//   first(k => k.name.startsWith('Arjeplog')),
//   mergeMap(k => generateBookingsInKommun(k))
// ).subscribe(booking => console.dir(booking))
