const { from } = require('rxjs')

const { safeId } = require('../lib/id')
const Passenger = require('../lib/models/passenger')

const polarbrödÄlvsByn = {
  lat: 66.051716,
  lon: 18.020213,
}

const arjeplog = {
  lat: 66.050503,
  lon: 17.88777,
}

function generatePassengers() {
  const passenger = {
    id: safeId(),
    pickup: arjeplog,
    destination: polarbrödÄlvsByn,
    position: arjeplog,
    name: 'average joe',
  }
  const passenger2 = {
    id: safeId(),
    pickup: { lon: 10.986855, lat: 50.041054 },
    destination: { lon: 10.986855, lat: 50.141054 },
    position: { lon: 10.886855, lat: 50.041054 },
    name: 'average elsewhere',
  }
  passengers = [new Passenger(passenger), new Passenger(passenger2)]
  return from(passengers)
}
module.exports = {
  generatePassengers,
}
