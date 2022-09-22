const { ReplaySubject } = require('rxjs')
const { safeId } = require('./../id')
const Journey = require('./journey')

class Passenger {
  constructor({ name, journeys, position, startPosition }) {
    this.id = safeId()
    this.journeys =
      journeys?.map(
        (journey) => new Journey({ ...journey, passenger: this })
      ) || []
    this.name = name
    this.position = position
    this.startPosition = startPosition
    this.distance = 0
    this.cost = 0
    this.co2 = 0
    this.inVehicle = false

    // Aggregated values
    this.co2 = 0
    this.cost = 0
    this.distance = 0
    this.moveTime = 0 // Time on a vehicle.
    this.waitTime = 0 // Time waiting for a vehicle.
    this.pickedUpEvents = new ReplaySubject()
    this.deliveredEvents = new ReplaySubject()
  }

  reset() {
    this.position = this.startPosition
    this.inVehicle = false
  }

  toObject(includeJourneys = true) {
    const obj = {
      co2: this.co2,
      cost: this.cost,
      distance: this.distance,
      id: this.id,
      inVehicle: this.inVehicle,
      journeys: this.journeys,
      moveTime: this.moveTime,
      name: this.name,
      position: this.position,
      waitTime: this.waitTime,
    }
    if (includeJourneys) {
      obj.journeys = this.journeys.map((journey) => journey.toObject())
    }
    return obj
  }

  updateJourney(journeyId, status) {
    const journeyToUpdate = this.journeys.find(
      (journey) => journey.id === journeyId
    )
    journeyToUpdate.setStatus(status)
  }

  moved(position, metersMoved, co2, cost, moveTime) {
    this.position = position

    // Aggregate values
    this.co2 += co2
    this.cost += cost
    this.distance += metersMoved
    this.moveTime += moveTime
  }

  pickedUp(journeyId) {
    this.inVehicle = true
    this.updateJourney(journeyId, 'Pågående')
    this.pickedUpEvents.next(this.toObject())
  }

  delivered(journeyId) {
    this.inVehicle = false
    this.updateJourney(journeyId, 'Avklarad')
    this.deliveredEvents.next(this.toObject())
  }
}

module.exports = Passenger
