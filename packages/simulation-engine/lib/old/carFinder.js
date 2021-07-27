const carPositions = require('../simulator/cars')
const cars = new Map()
const distance = require('./distance')
const osrm = require('./osrm')
const _ = require('highland')

_(carPositions).fork()
  .filter(car => car)
  .each(car => {
    cars.set(car.id, car)
  })

function estimateTimeToArrival (car, destination) {
  return osrm.route(car.position, destination)
    .then(route => {
      return ({
        distance: route.distance,
        route: route,
        tta: route.duration || 9999,
        car: car
      })
    })
    .catch(err => console.error('estimated route', err))
}

const closestCars = (booking, within = 5000) => _.pipeline(stream =>
  stream
  .map(car => ({ distance: distance.haversine(car.position, booking.departure), car: car }))
  .filter(hit => hit.distance < within)
  .sortBy((a, b) => a.distance - b.distance)
  .map(hit => hit.car)
  .filter(car => !car.busy)
  .errors(err => console.error('closestCars', err))
)

const fastestCars = booking => _.pipeline(stream =>
  stream
  .ratelimit(5, 500)
  .flatMap(car => _(estimateTimeToArrival(car, booking.departure)))
  .errors(err => console.error('estimate err', err))
  .sortBy((a, b) => a.tta - b.tta)
  // .filter(hit => hit.tta < 15 * 60)
  .errors(err => console.error('fastestCars', err))
)

const findCars = booking => _.merge(_(cars.values()), _(carPositions).fork())
  .pipe(closestCars(booking))
  .take(50)
  .tap(car => console.log('closest', car.id, car.tta))
  .pipe(fastestCars(booking))
  .tap(car => console.log('fastest', car.id, car.tta))
  .take(5)
  .errors(err => console.error('findCars', err))

module.exports = findCars
