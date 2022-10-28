const {
  interval,
  map,
  filter,
  shareReplay,
  distinctUntilChanged,
  mergeMap,
  of,
  from,
  catchError,
  tap,
  retry,
  ReplaySubject,
  mapTo,
} = require('rxjs')
const { virtualTime } = require('../virtualTime')

const { safeId } = require('../id')
const moment = require('moment')
const Booking = require('./booking')
const pelias = require('../pelias')
const { error } = require('../log')
const Position = require('./position')

class Citizen {
  constructor({ name, position, workplace, home, startPosition, kommun }) {
    this.id = 'p-' + safeId()
    this.workplace = {
      name: workplace.name,
      position: new Position(workplace.position),
    }
    this.home = { name: home.name, position: new Position(home.position) }
    this.name = name
    this.position = new Position(position)
    this.startPosition = new Position(startPosition)
    this.kommun = kommun
    this.distance = 0
    this.cost = 0
    this.co2 = 0
    this.inVehicle = false
    this.kommun = kommun

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
        if (hour < 4 && hour > 22) return 'sleep'
        if (hour >= 12 && hour <= 16) return 'lunch'
        if (hour >= 4 && hour < 10) return 'goToWork'
        if (hour >= 16 && hour <= 18) return 'goHome'
        // pickup kids
        // go to gym
        // go to school etc
        return 'idle'
      })
    )

    const ignoredIntents = ['sleep', 'idle']
    this.bookings = this.intents.pipe(
      distinctUntilChanged(),
      filter((intent) => !ignoredIntents.includes(intent)),
      catchError((err) => error('passenger bookings err', err) || of(err)),
      mergeMap((intent) => {
        switch (intent) {
          case 'goToWork':
            return of(
              new Booking({
                type: 'passenger',
                passenger: this,
                pickup: this.home,
                destination: {
                  ...this.workplace,
                  timeWindow: [
                    virtualTime.time(),
                    virtualTime.time() + 60 * 60 * 1000,
                  ],
                },
              })
            )
          case 'goHome':
            return of(
              new Booking({
                type: 'passenger',
                passenger: this,
                pickup: {
                  ...this.workplace,
                  timeWindow: [
                    virtualTime.time(),
                    virtualTime.time() + 60 * 60 * 1000,
                  ],
                },
                destination: this.home,
              })
            )
          case 'lunch':
            return of(this.workplace.position).pipe(
              mergeMap((position) =>
                pelias.search('restaurang', position, 'venue')
              ),
              retry(3),
              catchError(
                (e) =>
                  console.error(
                    `Couldn't find lunchplace. ${this.name} have to eat at the office ¯\_(ツ)_/¯ `,
                    e.message
                  ) || of(null)
              ),
              filter((position) => position != null),
              mergeMap((lunchPlace) =>
                from([
                  new Booking({
                    type: 'passenger',
                    passenger: this,
                    // Pickup to go to lunch
                    pickup: {
                      ...this.workplace,
                      departureTime: moment(virtualTime.time())
                        .add(1, 'hour')
                        .format('hh:mm:ss'),
                    },
                    destination: lunchPlace,
                  }),
                  new Booking({
                    // Go back from lunch to work
                    type: 'passenger',
                    passenger: this,
                    pickup: {
                      ...lunchPlace,
                      departureTime: moment(virtualTime.time())
                        .add(2, 'hour')
                        .format('hh:mm:ss'),
                    },
                    destination: this.workplace,
                  }),
                ])
              )
            )
        }
        return of(null)
      }),
      filter((f) => f !== null),
      catchError((err) => error('passenger intent err', err) || of(err)),
      shareReplay()
    )

    this.pickedUpEvents = this.bookings.pipe(
      mergeMap((booking) => booking.pickedUpEvents),
      mapTo(this)
    )
    this.deliveredEvents = this.bookings.pipe(
      mergeMap((booking) => booking.deliveredEvents),
      mapTo(this)
    )
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
      kommun: this.kommun.name,
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

module.exports = Citizen
