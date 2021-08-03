const inside = require('point-in-polygon')

function isInsideCoordinates({ lon, lat }, coordinates) {
  return coordinates.some((coordinates) => inside([lon, lat], coordinates))
}

module.exports = { isInsideCoordinates }
