const { from } = require('rxjs')
const { safeId } = require('../id')
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
    from: arjeplog,
    to: polarbrödÄlvsByn,
    position: arjeplog,
    name: 'average joe',
  }
  passengers = [passenger]
  return from(passengers)
}

module.exports = {
  generatePassengers,
}
