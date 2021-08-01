const { from } = require('rxjs')
const { map, filter, concatMap, mergeMap, toArray, tap } = require('rxjs/operators')
const pelias = require('../lib/pelias')
const postombud = require('../streams/postombud')
const kommuner = require('../streams/kommuner')
const { haversine, addMeters } = require('../lib/distance')
const perlin = require('perlin-noise')

const xy = (i, size = 1000) => ({ x: i % size, y: Math.floor(i / size) })
let id = 0

// generate a pattern of random positions so we can take x out of these and get a natural pattern of these positions
const randomPositions = perlin
  .generatePerlinNoise(1000, 1000)
  .map((probability, i) => ({ ...xy(i), probability }))
  .sort((a, b) => b.probability - a.probability) // sort them so we can just pick how many we want

function generateBookingsInKommun(kommunName) {
  const kommun = from(kommuner).pipe(
    filter((k) => k.name.startsWith(kommunName)) // supports Arjeplog ~= Arjeplogs kommun
  )

  let before 
  const squares = kommun.pipe(concatMap((kommun) =>
      from(kommun.squares).pipe(concatMap((square) =>
          from(postombud).pipe(
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
    )
  )

  const addresses = squares.pipe(
    mergeMap(( {total, nearestOmbud, position} ) =>
      randomPositions
        .slice(0, total) // one address per person in this square km2
        .map(({ x, y }) => addMeters(position, { x, y }))
        .map((position) => ({ nearestOmbud, position }))
    )
  )

  const bookings = addresses.pipe(
    concatMap(({ nearestOmbud, position }) =>
      pelias.nearest(position).then((address) => ({ id: id++, destination: address, pickup: nearestOmbud }))
    )
  )
  return bookings
}

module.exports = { generateBookingsInKommun }