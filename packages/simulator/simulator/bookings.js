const { from, of } = require('rxjs')
const { map, filter, first, mergeMap, toArray } = require('rxjs/operators')
const pelias = require('../lib/pelias')
const { haversine, addMeters } = require('../lib/distance')
const perlin = require('perlin-noise')
const Booking = require('../lib/models/booking')

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })

// generate a pattern of random positions so we can take x out of these and get a natural pattern of these positions
const randomPositions = perlin
  .generatePerlinNoise(100, 100)
  .map((probability, i) => ({ x: xy(i).x * 10, y: xy(i).y * 10, probability }))
  .sort((a, b) => b.probability - a.probability) // sort them so we can just pick how many we want

function generateBookingsInMunicipality(municipality) {
  // a square is a km2 box with a population total. We will here populate each square with nearest postombud
  const squaresWithNearestPostombud = municipality.squares.pipe(
    mergeMap((square) =>
      municipality.postombud.pipe(
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
    )
  )

  const bookings = randomPointsInSquares.pipe(
    toArray(), // convert to array to be able to sort the addresses
    mergeMap((a) => from(a.sort(() => Math.random() - 0.5))),
    mergeMap(({ nearestOmbud, position }) =>
      municipality.fleets.pipe(
        first((fleet) => nearestOmbud.operator.startsWith(fleet.name), null), // Find DHL_Express or DHL_Freight from DHL
        mergeMap((fleet) =>
          fleet ? of(fleet) : municipality.fleets.pipe(first())
        ), // TODO: defaultIfEmpty
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
    filter((p) => p !== null)
  )
  return bookings
}

module.exports = { generateBookingsInMunicipality }
