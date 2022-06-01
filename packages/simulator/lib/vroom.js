const fetch = require('node-fetch')
const vroomUrl = process.env.VROOM_URL || 'https://froom.predictivemovement.se'
const { decodePolyline } = require('./osrm')

module.exports = {
  plan(stops, vehicles, bookings) {
    return (
      fetch(vroomUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobs: stops.map((stop) => ({
            id: stop.id,
            description: stop.description,
            location: stop.location,
          })),
          shipments: bookings.map((booking) => ({
            id: booking.id,
            description: booking.description,
            location: booking.location,
          })),
          vehicles: vehicles.map((vehicle) => ({
            id: vehicle.id,
            start: vehicle.position,
            end: vehicle.heading.position,
          })),
        }),
      })
        .then((response) => response.json())
        // fastest route
        .then(
          (result) =>
            result.routes &&
            result.routes.sort((a, b) => a.duration < b.duration)[0]
        )
        .then((route) => {
          if (!route) return {}

          route.geometry = { coordinates: decodePolyline(route.geometry) }
          return route
        })
    )
  },
}
