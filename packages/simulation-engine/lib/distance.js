const _ = require('highland')


function convertPosition (pos) {
  return {
    lon: pos.longitude || pos.lon || pos.lng,
    lat: pos.latitude || pos.lat
  }
}

function closestCars (cars, position) {
  return _(cars)
    .map(car => ({ distance: pythagoras(car.position, position), car: car }))
    .sortBy((a, b) => a.distance - b.distance)
    .errors(err => console.error('closestCars', err))
}

function pythagoras (from, to) {
  from = convertPosition(from)
  to = convertPosition(to)
  // quick approximation with pythagoras theorem
  return Math.sqrt(Math.pow(Math.abs(from.lat - to.lat), 2) + Math.pow(Math.abs(from.lon - to.lon), 2))
}

function rad (x) { return x * Math.PI / 180 }

/* Distance in meters between two points using the Haversine algo.
*/
function haversine (p1, p2) {
  p1 = convertPosition(p1)
  p2 = convertPosition(p2)

  const R = 6371000
  const dLat = rad(p2.lat - p1.lat)
  const dLong = rad(p2.lon - p1.lon)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c

  return Math.round(d)
}

function bearing (p1, p2) {
  return Math.round(Math.atan2(Math.cos(p1.lat) * Math.sin(p2.lat) - Math.sin(p1.lat) * Math.cos(p2.lat) * Math.cos(p2.lon - p1.lon), Math.sin(p2.lon - p1.lon) * Math.cos(p2.lat)) * 180 / Math.PI)
}

module.exports = {closestCars, pythagoras, haversine, bearing}
