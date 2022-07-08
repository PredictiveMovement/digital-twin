const { from } = require('rxjs')
const { subscribe } = require('rxjs/operators')
const { save } = require('./elastic')
const { safeId } = require('./id')

// TODO: Remove exampleJourney once the stream feeds this function instead
const exampleJourney = {
  id: 'vGLr-vxBkx',
  status: 'Assigned',
  co2: 0,
  cost: 0,
  distance: 0,
  tripTime: 3000000,
  weight: 0.041350018304702196,
  pickup: { position: { lon: 11.016601, lat: 52.622044 } },
  destination: { position: { lon: 22.20803, lat: 65.5825 } },
  finalDestination: {
    name: 'Lillstrandsvägen 2B',
    position: { lon: 24.229152, lat: 66.589606 },
  },
  origin: 'Länstrafiken Norrbotten',
  position: { lon: 13.016601, lat: 55.622044 },
  kommun: { name: 'Luleå kommun', id: '2580' },
  fleet: { name: 'Länstrafiken Norrbotten' },
  assignedDateTime: 1655271228420,
}

const generateJourneys = () => {
  const journeys = []
  for (let i = 0; i < 100; i++) {
    journeys.push({
      id: safeId(),
      status: 'Assigned',
      co2: Math.random() * 200,
      cost: Math.random() * 80,
      distance: Math.random() * 450,
      tripTime: Math.random() * 3000000,
      weight: 0.041350018304702196,
      pickup: { position: { lon: 11.016601, lat: 52.622044 } },
      destination: { position: { lon: 22.20803, lat: 65.5825 } },
      finalDestination: {
        name: 'Lillstrandsvägen 2B',
        position: { lon: 24.229152, lat: 66.589606 },
      },
      origin: 'Länstrafiken Norrbotten',
      position: { lon: 13.016601, lat: 55.622044 },
      kommun: { name: 'Luleå kommun', id: '2580' },
      fleet: { name: 'Länstrafiken Norrbotten' },
      assignedDateTime: 1655271228420 + i * 1000,
    })
  }
  return journeys
}

const collectJourney = (incomingJourney) => {
  const journey = {
    id: incomingJourney.id,
    assignedDateTime: incomingJourney.assignedDateTime,
    status: incomingJourney.status,
    co2: incomingJourney.co2,
    cost: incomingJourney.cost,
    distance: incomingJourney.distance,
    tripTime: incomingJourney.tripTime,
    weight: incomingJourney.weight,
    pickup_position: incomingJourney.pickup.position,
    destination_position: incomingJourney.destination.position,
    finalDestination_position: incomingJourney.finalDestination.position,
    finalDestination_name: incomingJourney.finalDestination.name,
    origin: incomingJourney.origin,
    position: incomingJourney.position,
    kommun_name: incomingJourney.kommun.name,
    kommun_id: incomingJourney.kommun.id,
    fleet_name: incomingJourney.fleet.name,
  }
  return save(journey, 'journeys')
}

module.exports = {
  collectJourney,
  exampleJourney,
  generateJourneys,
}
