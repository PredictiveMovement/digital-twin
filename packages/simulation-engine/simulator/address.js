const osrm = require('../lib/osrm')
//var start = { lat: 59.34421956363667, lon: 17.89501190185547 }
const tegnergatan = { lat: 59.338947, lon: 18.057236 }
const ljusdal = { lat: 61.829182, lon: 16.0896213 }
const start = ljusdal

function randomize(center = start, retry = 20) {
  if (retry < 0)
    throw new Error('Randomize in loop try nr' + retry + JSON.stringify(center))

  const randomPoint = {
    lon: center.lon + (Math.random() - 0.5) / 2,
    lat: center.lat + (Math.random() - 0.5) / 5,
  }
  return nearest(randomPoint).then((pos) =>
    pos === null ? randomize(center, retry--) : pos
  )
}

function nearest(position) {
  // get a correct street address
  return osrm.nearest(position).then((data) => {
    // if we randomized in the middle of nowhere, or a street with no name, try again?
    if (!data.waypoints || !data.waypoints.length) return null

    const nearest = data.waypoints[0]
    const [lon, lat] = nearest.location
    const name = nearest.name
    return { lon, lat, name }
  })
}

module.exports = {
  randomize,
  nearest,
}
