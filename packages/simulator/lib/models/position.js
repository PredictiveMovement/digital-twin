const { haversine } = require('../distance')

class Position {
  constructor({ lon, lat }) {
    this.lon = lon
    this.lat = lat
  }
  distanceTo(position) {
    return haversine(this, position)
  }
  toObject() {
    return { lon: this.lon, lat: this.lat }
  }
}

module.exports = Position
