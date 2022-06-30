const { from } = require('rxjs')
const EventEmitter = require('events')
const { safeId } = require('../id')
class Passenger extends EventEmitter {
  constructor({ id, pickup, destination, name, position }) {
    super()
    this.id = id
    this.pickup = pickup
    this.destination = destination
    this.name = name
    this.position = position
  }
  pickedUp() {
    emit('pickedUp', this.id)
  }
}
const polarbrödÄlvsByn = {
  lat: 65.669641,
  lon: 20.975453,
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
    pickup: { lon: 10.886855, lat: 50.041054 },
    destination: { lon: 10.986855, lat: 50.141054 },
    position: { lon: 10.886855, lat: 50.041054 },
    name: 'average elsewhere',
  }
  passengers = [new Passenger(passenger), new Passenger(passenger2)]
  return from(passengers)
}
module.exports = {
  generatePassengers,
  Passenger,
}
