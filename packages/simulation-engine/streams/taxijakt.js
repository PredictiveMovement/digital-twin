const fetch = require('node-fetch')
const _ = require('highland')
const Car = require('../lib/car')
const cars = {}

function fetchPositions (push, next) {
  fetch('https://taxijakt.se/zf/public/modules/wave/api/getAllOnlineDrivers.php')
  .then(res => res.json())
  .then(res => res.drivers)
  .then(drivers => push(null, drivers))
  .then(() => next())
  .catch(err => push(err))
}

const $positions = _(fetchPositions)
  .ratelimit(1, 10000)
  .flatten()
  //.tap(_.log)
  .map(data => ({id: data.id, lat: data.lat, lon: data.lng, status: data.status === 'AVAILABLE' ? 'F' : 'N', date: Date.now()}))
  // .filter(car => distance.haversine(car, tegnergatan) < 1500)
  .doto(position => (cars[position.id] = cars[position.id] || new Car(position.id, position, position.status)))
  .map(position => ({ car: cars[position.id], position }))
  .errors(console.error)
  .flatMap(cp => _(cp.car.updatePosition(cp.position, cp.position.date)))
  // .map(car => _('moved', car))

module.exports = $positions
