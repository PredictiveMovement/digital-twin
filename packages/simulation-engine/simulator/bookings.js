const { from } = require('rxjs')
const {
  map,
  first,
  filter,
  concatMap,
  mergeMap,
  toArray,
} = require('rxjs/operators')
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
    first((k) => k.name.startsWith(kommunName)) // supports "Arjeplog" ~= "Arjeplogs kommun"
  )

  // a square is a km2 box with a population total. We will here populate each square with nearest postombud
  const squaresWithNearestPostombud = kommun.pipe(
    mergeMap((kommun) =>
      from(kommun.squares).pipe(
        mergeMap((square) =>
          from(kommun.postombud).pipe(
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

  const randomPointsInSquares = squaresWithNearestPostombud.pipe(
    // generate points in random patterns within each square
    mergeMap(({ population, nearestOmbud, position }) => 
      randomPositions
        .slice(0, population) // one address per person in this square km2
        .map(({ x, y }) => addMeters(position, { x, y }))
        .map((position) => 
          ({ nearestOmbud, position })
        )
    ),
    toArray(),
    mergeMap(a =>
      from(a.sort(() => Math.random() - 0.5))
    ), // pick a random adress
  )

  const bookings = randomPointsInSquares.pipe(
    concatMap(({ nearestOmbud, position }) =>
      pelias
        .nearest(position)
        .then((address) => ({
          id: id++,
          pickup: nearestOmbud,
          destination: address,
        }))
    )
  )
  return bookings
}

module.exports = { generateBookingsInKommun }

// generateBookingsInKommun('Arjeplog').subscribe(boooking => console.dir(booking))
