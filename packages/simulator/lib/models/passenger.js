const EventEmitter = require('events')
const {
  interval,
  map,
  filter,
  shareReplay,
  distinctUntilChanged,
  mergeMap,
  of,
  from,
} = require('rxjs')
const { randomize } = require('../../simulator/address')
const { virtualTime } = require('../virtualTime')

const { safeId } = require('./../id')
const Journey = require('./journey')
const moment = require('moment')
const Booking = require('./booking')

class Passenger {
  constructor({ name, position, workplace, home, startPosition }) {
    this.id = 'p-' + safeId()
    this.workplace = workplace
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
      //filter(() => Math.random() > 0.5),
      map(({ hour }) => {
        if (hour < 4 || hour > 22) return 'sleep'
        if (hour >= 12 || hour <= 16) return 'lunch'
        if (hour >= 4 || hour < 10) return 'goToWork'
        if (hour >= 16 || hour <= 18) return 'goHome'
        // pickup kids
        // go to gym
        // go to school etc
        return 'idle'
      })
    )

    this.bookings = this.intents.pipe(
      distinctUntilChanged(),
      filter((intent) => intent !== 'idle' && intent !== 'sleep'),
      mergeMap((intent) => {
        switch (intent) {
          case 'goToWork':
            return of(
              new Booking({
                type: 'passenger',
                pickup: this.home,
                destination: {
                  ...this.workplace,
                  timeWindow: [
                    virtualTime.time(),
                    virtualTime.time() + 60 * 60 * 1000,
                  ],
                },
                passenger: this,
              })
            )
          case 'goHome':
            return of(
              new Booking({
                type: 'passenger',
                pickup: {
                  ...this.workplace,
                  timeWindow: [
                    virtualTime.time(),
                    virtualTime.time() + 60 * 60 * 1000,
                  ],
                },
                destination: this.home,
                passenger: this,
              })
            )
          case 'lunch':
            return from(randomize(this.workplace.position)).pipe(
              map((position) => ({
                position,
              })),
              mergeMap((lunchPlace) =>
                from([
                  new Booking({
                    type: 'passenger',
                    // Pickup to go to lunch
                    pickup: {
                      ...this.workplace,
                      timeWindow: [
                        virtualTime.time(),
                        virtualTime.time() + 60 * 60 * 1000,
                      ],
                    },
                    destination: lunchPlace,
                    passenger: this,
                  }),
                  new Booking({
                    // Go back from lunch to work
                    type: 'passenger',
                    pickup: lunchPlace,
                    destination: {
                      ...this.workplace,
                      timeWindow: [
                        virtualTime.time() + 60 * 60 * 1000,
                        virtualTime.time() + 80 * 60 * 1000,
                      ],
                    },
                    passenger: this,
                  }),
                ])
              )
            )
        }
        return of(null)
      }),
      filter((f) => f !== null),
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
      moveTime: this.moveTime,
      name: this.name,
      position: this.position,
      waitTime: this.waitTime,
    }
    return obj
  }

  moved(position, metersMoved, co2, cost, moveTime) {
    this.position = position

    // Aggregate values
    this.co2 += co2
    this.cost += cost
    this.distance += metersMoved
    this.moveTime += moveTime
  }
}

module.exports = Passenger
