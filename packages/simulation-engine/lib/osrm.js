const fetch = require('node-fetch')
const polyline = require('polyline')
const osrmUrl = process.env.OSRM_URL || 'https://osrm.iteamdev.io' || 'http://localhost:5000'

module.exports = {
  route (from, to) {

    // http://{server}/route/v1/{profile}/{coordinates}?alternatives={true|false}&steps={true|false}&geometries={polyline|geojson}&overview={full|simplified|false}&annotations={true|false}
    const coordinates = [[from.lon, from.lat], [to.lon, to.lat]].join(';')
    return fetch(`${osrmUrl}/route/v1/driving/${coordinates}?steps=true&alternatives=false&overview=full&annotations=true`)
      .then(response => response.json())

      // fastest route
      .then(result => result.routes && result.routes.sort((a, b) => a.duration < b.duration)[0])
      .then(route => {
        if (!route) return {}

        route.geometry = { coordinates: decodePolyline(route.geometry) }
        return route
      })
  },
  nearest (position) {
    const coordinates = [position.lon, position.lat].join(',')
    return fetch(`${osrmUrl}/nearest/v1/driving/${coordinates}`)
      .then(response => response.json())
  },
  match (positions) {
    const coordinates = positions.map(pos => [pos.position.lon, pos.position.lat].join(',')).join(';')
    const timestamps = positions.map(pos => Math.round(+pos.date / 1000)).join(';')
    return fetch(`${osrmUrl}/match/v1/driving/${coordinates}?timestamps=${timestamps}&geometries=geojson&annotations=true&overview=full`) // Add annotations and steps to get each node speed
      .then(response => response.json())
      .then(route => {
        return route
      })
  }
}

const decodePolyline = function (geometry) {
  return polyline
    .decode(geometry)
    .map(point => ({
      lat: point[0],
      lon: point[1]
    }))
}

