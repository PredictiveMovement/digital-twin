const EventEmitter = require('events')

class Passenger extends EventEmitter {
  constructor({ id, name, journeys, position }) {
    super()
    this.id = id
    this.journeys = journeys
    this.name = name
    this.position = position
    this.inVehicle = false
  }

  toObject() {
    return {
      id: this.id,
      journeys: this.journeys,
      name: this.name,
      position: this.position,
      inVehicle: this.inVehicle,
    }
  }

  updateJourney(journeyId, status) {
    const journeyToUpdate = this.journeys.find((journey) => (
      journey.id === journeyId
    ))
    journeyToUpdate.status = status
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
