const { from } = require('rxjs')
const { map, filter, concatMap, mergeMap } = require('rxjs/operators')
const address = require('./address')
const postombud = require('../streams/postombud')
const population = require('../streams/population')
const { haversine, addMeters } = require('../lib/distance')
const perlin = require('perlin-noise')

const xy = (i, size = 1000) => ({ x: i % size, y: Math.floor(i / size) })

// generate a pattern of random positions so we can take x out of these and get a natural pattern of these positions
const randomPositions = perlin
  .generatePerlinNoise(1000, 1000)
  .map((probability, i) => ({ ...xy(i), probability }))
  .sort((a, b) => b.probability - a.probability)

function generateBookingsInKommun(kommun, metersFromOmbud = 10000) {
  const areas = from(postombud).pipe(
    filter((ombud) => ombud.kommun === kommun),
    concatMap((ombud) =>
      from(population).pipe(
        map((area) => ({ ombud, area })),
        filter(
          ({ area, ombud }) =>
            haversine(ombud.position, area.position) < metersFromOmbud
        )
      )
    )
  )

  const addresses = areas.pipe(
    mergeMap(({ area, ombud }) =>
      randomPositions
        .slice(0, area.total)
        .map(({ x, y }) => addMeters(area.position, { x, y }))
        .map((position) => ({ area, ombud, position }))
    )
  )

  const bookings = addresses.pipe(
    concatMap(({ area, ombud, position }) =>
      address.randomize(position).then((address) => ({ ombud, address }))
    )
  )
  return bookings
}

module.exports = { generateBookingsInKommun }
