const EventEmitter = require('events')

class Passenger extends EventEmitter {
  constructor({ id, name, journeys, position }) {
    super()
    this.id = id
    this.journeys = journeys
    this.name = name
    this.position = position
    this.inVehicle = false

    // Aggregated values
    this.co2 = 0
    this.cost = 0
    this.distance = 0
    this.moveTime = 0 // Time on a vehicle.
    this.waitTime = 0 // Time waiting for a vehicle.
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
    const journeyToUpdate = this.journeys.find(
      (journey) => journey.id === journeyId
    )
    journeyToUpdate.status = status
  }

  moved(position, metersMoved, co2, cost, moveTime) {
    this.position = position

    // Aggregate values
    this.co2 += co2
    this.cost += cost
    this.distance += metersMoved
    this.moveTime += moveTime

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
