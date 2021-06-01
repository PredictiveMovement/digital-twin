const osrm = require('../lib/osrm')
//var start = { lat: 59.34421956363667, lon: 17.89501190185547 }
const tegnergatan = { lat: 59.338947, lon: 18.057236 }
const ljusdal = { lat: 61.829182, lon: 16.0896213 }
const start = ljusdal

function randomize (center, retry = 20) {
  if (retry < 0) throw new Error('Randomize in loop try nr' + retry)
  const randomPoint = { lon: start.lon + (Math.random() - 0.5) / 2, lat: start.lat + (Math.random() - 0.5) / 5 }
  // get a correct street address
  return osrm.nearest(center || randomPoint)
    .then((data) => {
      
      // if we randomized in the middle of nowhere, or a street with no name, try again?
      if (!data.waypoints || !data.waypoints.length) return randomize(center, retry - 1)
      const nearest = data.waypoints[0]
      randomPoint.lon = nearest.location[0]
      randomPoint.lat = nearest.location[1]
      randomPoint.address = nearest.name
      return randomPoint
    })
}

module.exports = randomize
