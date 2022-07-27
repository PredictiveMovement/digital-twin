const { from, of } = require('rxjs')
const { map, tap, filter, first, mergeMap, toArray } = require('rxjs/operators')
const pelias = require('../lib/pelias')
const { haversine, addMeters } = require('../lib/distance')
const perlin = require('perlin-noise')

const { safeId } = require('../lib/id')
const Passenger = require('../lib/models/passenger')

const polarbrödÄlvsByn = {
  lat: 65.669641,
  lon: 20.975453,
}

const elsewhere = {
  lat: 66.051716,
  lon: 18.020213,
}

const arjeplog = {
  lat: 66.050503,
  lon: 17.88777,
}

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })

// generate a pattern of random positions so we can take x out of these and get a natural pattern of these positions
const randomPositions = perlin
  .generatePerlinNoise(100, 100)
  // .generatePerlinNoise(1, 1)
  .map((probability, i) => ({
    x: xy(i).x * 10,
    y: xy(i).y * 10,
    probability,
  }))
  .sort((a, b) => b.probability - a.probability) // sort them so we can just pick how many we want

function generatePassengers(kommuner) {
  // // a square is a km2 box with a population total. We will here populate each square with nearest postombud
  return kommuner.pipe(
    mergeMap((kommun) => {
      const squaresWithNearestPostombud = kommun.squares.pipe(
        mergeMap((square) =>
          kommun.postombud.pipe(
            map((ombud) => ({
              ...ombud,
              distance: haversine(ombud.position, square.position),
            })),
            toArray(),
            map((ombud) =>
              ombud.sort((a, b) => a.distance - b.distance).shift()
            ),
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
        // toArray(), // convert to array to be able to sort the addresses
        // mergeMap((a) => from(a.sort((p) => Math.random() - 0.5))),
        mergeMap(({ position }) => {
          return pelias
            .nearest(position)
            .then((address) => {
              // console.log(address)
              return new Passenger({
                pickup: address.position,
                id: safeId(),
                position: address.position,
                destination: polarbrödÄlvsByn,
                name: 'hopp',
              })
            })
            .catch((_) => null)
        }, 1),
        filter((p) => p !== null)
      )

      return bookings
    })
  )
}
module.exports = {
  generatePassengers,
}
