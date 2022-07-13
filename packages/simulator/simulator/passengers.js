const { from } = require('rxjs')

const { safeId } = require('../lib/id')
const Passenger = require('../lib/models/passenger')

const polarbrödÄlvsByn = {
  lat: 65.669641,
  lon: 20.975453,
}

const elsewhere = {
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
    pickup: polarbrödÄlvsByn,
    destination: arjeplog,
    position: polarbrödÄlvsByn,
    name: 'average elsewhere',
  }
  passengers = [new Passenger(passenger), new Passenger(passenger2)]
  return from(passengers)
}
module.exports = {
  generatePassengers,
}
