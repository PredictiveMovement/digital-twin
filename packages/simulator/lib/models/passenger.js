const EventEmitter = require('events')
const {
  interval,
  map,
  filter,
  shareReplay,
  distinctUntilChanged,
  mergeMap,
} = require('rxjs')
const { randomize } = require('../../simulator/address')
const { virtualTime } = require('../virtualTime')

const { safeId } = require('./../id')
const Journey = require('./journey')

class Passenger {
  constructor({ name, position, workplace, home, startPosition }) {
    this.id = safeId()
    this.workPlace = workplace
    this.home = home
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

    this.intents = interval(1000).pipe(
      map(() => ({
        hour: moment(virtualTime.time()).hour(),
        weekDay: moment(virtualTime.time()).isoWeekday(),
      })),
      filter(() => Math.random() > 0.9),
      map(({ hour }) => {
        if (hour < 6 || hour > 22) return 'sleep'
        if (hour >= 12 || hour <= 16) return 'lunch'
        if (hour >= 6 || hour < 10) return 'goToWork'
        if (hour >= 16 || hour <= 18) return 'goHome'
        // pickup kids
        // go to gym
        // go to school etc
        return 'idle'
      }),
      shareReplay()
    )

    this.journeys = this.intents.pipe(
      distinctUntilChanged(),
      filter((intent) => intent !== 'idle' && intent !== 'sleep'),
      mergeMap((intent) => {
        switch (intent) {
          case 'goToWork':
            return new Journey({
              pickup: this.position,
              destination: this.workPlace.position,
              intent,
              timeWindow: [
                virtualTime.time(),
                virtualTime.time() + 60 * 60 * 1000,
              ],
              id: safeId(),
              passenger: this,
            })
          case 'goHome':
            return new Journey({
              pickup: this.position,
              destination: this.home.position,
              intent,
              timeWindow: [
                virtualTime.time(),
                virtualTime.time() + 60 * 60 * 1000,
              ],
              id: safeId(),
              passenger: this,
            })
          case 'lunch':
            return randomize(this.workPlace.position).pipe(
              mergeMap((destination) =>
                from([
                  new Journey({
                    // Pickup to lunch
                    pickup: this.position,
                    destination: this.home.position,
                    intent,
                    timeWindow: [
                      virtualTime.time(),
                      virtualTime.time() + 60 * 60 * 1000,
                    ],
                    id: safeId(),
                    passenger: this,
                  }),
                  new Journey({
                    // Go back from lunch to work
                    pickup: destination,
                    destination: this.workPlace.position,
                    intent,
                    timeWindow: [
                      virtualTime.time() + 60 * 60 * 1000,
                      virtualTime.time() + 80 * 60 * 1000,
                    ],
                    id: safeId(),
                    passenger: this,
                  }),
                ])
              )
            )
          default:
            return this.idle()
        }
      }),
      shareReplay()
    )
    this.pickedUpEvents = new ReplaySubject()
    this.deliveredEvents = new ReplaySubject()
  }

  reset() {
    this.position = this.startPosition
    this.inVehicle = false
  }

  toObject() {
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
