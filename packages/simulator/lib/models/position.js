const { haversine } = require('../distance')

class Position {
  constructor({ lon, lat, name }) {
    this.lon = lon
    this.lat = lat
    this.name = name
  }
  distanceTo(position) {
    return haversine(this, position)
  }
  toObject() {
    return { lon: this.lon, lat: this.lat }
  }
}

module.exports = Position
