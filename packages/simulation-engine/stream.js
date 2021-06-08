var carPositions = require('../streams/cars')
var cars = {}
var distance = require('./distance')
var time = require('./time')
var _ = require('highland')

var tegnergatan = { lat: 59.338947, lon: 18.057236 }

_(carPositions).fork().each(car => {
  cars[car.id] = car // discover new cars
})

var closestCars = booking => _.pipeline(stream =>
  stream.map(car => ({ distance: distance.pythagoras(car.position, booking.departure), car: car }))
  .sortBy((a, b) => a.distance - b.distance)
  .map(hit => hit.car)
  .filter(car => !car.busy)
  .errors(err => console.error('closestCars', err))
)

var fastestCars = booking => _.pipeline(stream =>
  stream
  .ratelimit(5, 500)
  .flatMap(car => _(time.estimateTimeToArrival(car, booking.departure)))
  .errors(console.error)
  .sortBy((a, b) => a.tta - b.tta)
  .filter(hit => hit.tta < 15 * 60)
  .errors(err => console.error('fastestCars', err))
)

var findCars = booking => _.values(cars)
  .pipe(closestCars(booking))
  .take(50)
  .pipe(fastestCars(booking))
  .take(5)
  .each(car => console.log('car', car.id, car.tta))


