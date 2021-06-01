const inside = require('point-in-polygon')
const zones = []

const transformed = zones.map(zone => {
  const coords = zone.coordinates.map(coord => ([coord.longitude, coord.latitude]))
  return [zone.number, coords]
})

function findZone (position) {
  return transformed.find(zone => {
    return inside([position.lon, position.lat], zone[1])
  })
}

module.exports = findZone

/*

tests:

var tegnergatan = { lat: 59.338947, lon: 18.057236 }
var testEdge = { lat: 59.286549, lon: 17.87521 }

console.log(findZone(tegnergatan)[0])
console.log(findZone(testEdge)[0])
*/
