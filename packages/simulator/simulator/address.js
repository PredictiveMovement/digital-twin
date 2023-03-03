const osrm = require('../lib/osrm')
const assert = require('assert')
const Position = require('../lib/models/position')
const { addMeters } = require('../lib/distance')
const fetch = require('node-fetch')
const streamsUrl =
  process.env.STREAMS_URL || 'https://streams.predictivemovement.se/addresses'

const getAddressesInBoundingBox = (
  topLeft,
  bottomRight,
  size = 10,
  layers = 'venue' // TODO: activate this feature in box.js
) =>
  fetch(
    `${streamsUrl}/box?tl=${topLeft.lon},${topLeft.lat}&br=${bottomRight.lon},${bottomRight.lat}&size=${size}&layers=${layers}}`
  ).then((res) => (res.ok ? res.json() : Promise.reject(res.text())))

const getAddressesInArea = (position, area, population) => {
  const topLeft = addMeters(position, { x: -area / 2, y: area / 2 })
  const bottomRight = addMeters(position, { x: area / 2, y: -area / 2 })
  return getAddressesInBoundingBox(topLeft, bottomRight, population).catch(
    async (err) => {
      await err
      console.error('Error fetching addresses', err, position, area, population)
      return []
    }
  )
}

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
  getAddressesInArea,
}
