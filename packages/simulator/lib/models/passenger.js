const EventEmitter = require('events')

const { safeId } = require('./../id')
const Journey = require('./journey')

class Passenger extends EventEmitter {
  constructor({ name, journeys, position }) {
    super()
    this.id = safeId()
    this.journeys = journeys?.map((journey) => new Journey({ ...journey, passenger: this}) ) || []
    this.name = name
    this.position = position
    this.distance = 0
    this.cost = 0
    this.co2 = 0
    this.inVehicle = false
  }

  toObject(includeJourneys = true) {
    const obj = {
      id: this.id,
      name: this.name,
      position: this.position,
      inVehicle: this.inVehicle,
      distance: this.distance,
      cost: this.cost,
      co2: this.co2,
    }
    if(includeJourneys) {
      obj.journeys = this.journeys.map((journey) => journey.toObject())
    }
    return obj
  }

  updateJourney(journeyId, status) {
    const journeyToUpdate = this.journeys.find((journey) => (
      journey.id === journeyId
    ))
    journeyToUpdate.setStatus(status)
  }

  moved(position, metersMoved, co2, cost) {
    this.position = position
    this.distance += metersMoved
    this.cost += cost
    this.co2 += co2
    this.emit('moved', this.toObject())
  }

  pickedUp(journeyId) {
    this.inVehicle = true
    this.updateJourney(journeyId, 'Pågående')
    this.emit('pickedup', this.toObject())
  }
  delivered(journeyId) {
    this.inVehicle = false
    this.updateJourney(journeyId, 'Avklarad')
    this.emit('delivered', this.toObject())
  }
}

module.exports = Passenger
