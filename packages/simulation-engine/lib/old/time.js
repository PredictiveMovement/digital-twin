const osrm = require('./osrm')
const _ = require('highland')

function fastestCars (cars, destination) {
  return _(cars)
    .flatMap(car => _(estimateTimeToArrival(car, destination)))
    .sortBy((a, b) => a.tta - b.tta)
    .tap(car => console.log('tta', car.tta, 's'))
}

function estimateTimeToArrival (car, destination) {
  const carPosition = car.position
  return osrm.route(carPosition, destination)
    .then(route => {
      return ({
        distance: route.distance,
        tta: route.duration || 9999,
        car: car
      })
    })
    .catch((err) => console.error('route error', err, carPosition, destination))
}

module.exports = { fastestCars, estimateTimeToArrival }
