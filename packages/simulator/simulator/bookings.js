const { from, range, concatAll, expand, shareReplay } = require('rxjs')
const {
  map,
  tap,
  filter,
  concatMap,
  mergeMap,
  mergeAll,
  toArray,
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
        map((ombud) => ombud.sort((a, b) => a.distance - b.distance).pop()),
        map((nearestOmbud) => ({ ...square, nearestOmbud }))
      )
    ),
    // tap(s => console.log('squares', kommun.name)),
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
    /*mergeMap((point) => kommun.commercialAreas.pipe(
      first(area => isInsideCoordinates(point.position, area.geometry.coordinates), false),
      map(commercialArea => ({...point, isCommercial: !!commercialArea } ))
    )),*/
    //toArray(), // convert to array to be able to sort the addresses
    //mergeMap((a) => from(a.sort((p) => Math.random() - 0.5 - (p.isCommercial ? 2 : 0)))),
    mergeMap(({ nearestOmbud, position }) => {
      return pelias
        .nearest(position)
        .then(address => {
          console.log('got pelias address')
          return address
        }, (err) => {
          console.log('pelias error', err)
          throw err
        })
        .then((address) => new Booking({
          id: id++,
          pickup: nearestOmbud,
          isCommercial: address.layer === 'venue',
          destination: address,
        }))
        .catch(() => Promise.resolve(null))
    }, undefined, 1),
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
