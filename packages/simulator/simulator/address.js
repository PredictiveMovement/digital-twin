const osrm = require('../lib/osrm')
const assert = require('assert')
const Position = require('../lib/models/position')

function randomize(center, retry = 20, radius = 500) {
  assert(center, 'Center is required')
  if (retry < 0)
    throw new Error('Randomize in loop try nr' + retry + JSON.stringify(center))

  const randomPoint = {
    lon: center.lon + ((Math.random() - 0.5) * radius) / 20000,
    lat: center.lat + ((Math.random() - 0.5) * radius) / 50000,
  }
  return nearest(randomPoint).then((pos) =>
    pos === null ? randomize(center, retry--) : pos
  )
}

function nearest(position) {
  // get a correct street address
  assert(position.lon, 'Longitude required')
  assert(position.lat, 'Latitude required')

  return osrm.nearest(position).then((data) => {
    // if we randomized in the middle of nowhere, or a street with no name, try again?
    if (!data?.waypoints?.length) return null

    const nearest = data.waypoints[0]
    const [lon, lat] = nearest.location
    return new Position({ lon, lat })
  })
}

module.exports = {
  randomize,
  nearest,
}
