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
} = require('rxjs')
const { virtualTime } = require('../virtualTime')

const { safeId } = require('./../id')
const moment = require('moment')
const Booking = require('./booking')
const pelias = require('../pelias')
const { error } = require('../log')

class Passenger {
  constructor({ name, position, workplace, home, startPosition, kommun }) {
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
    this.kommun = kommun
    this.unfilledNeeds = []

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

    this.bookings = this.intents.pipe(
      distinctUntilChanged(),
      filter((intent) => intent !== 'idle' && intent !== 'sleep'),
      catchError((err) => error('passenger bookings err', err) || of(err)),
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
                    virtualTime.addMinutes(0),
                    virtualTime.addMinutes(60),
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
                    virtualTime.addMinutes(0),
                    virtualTime.addMinutes(60),
                  ],
                },
                destination: this.home,
                passenger: this,
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
                    // Pickup to go to lunch
                    pickup: {
                      ...this.workplace,
                      timeWindow: [
                        virtualTime.addMinutes(0),
                        virtualTime.addMinutes(60),
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
                        virtualTime.addMinutes(60),
                        virtualTime.addMinutes(80),
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
      catchError((err) => error('passenger intent err', err) || of(err)),
      shareReplay()
    )
    this.assignEvents = new ReplaySubject()
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
      unfilledNeeds: this.unfilledNeeds,
    }
    return obj
  }

  // updateBooking(bookingId, status) {
  //   const bookingToUpdate = this.bookings.find(
  //     (booking) => booking.id === bookingId
  //   )
  //   bookingToUpdate.setStatus(status)
  // }

  assign(bookingId) {
    this.unfilledNeeds.push(bookingId)
    this.assignedEvents.next(this.toObject())
  }

  moved(position, metersMoved, co2, cost, moveTime) {
    this.position = position

    // Aggregate values
    this.co2 += co2
    this.cost += cost
    this.distance += metersMoved
    this.moveTime += moveTime
  }

  pickedUp(bookingId) {
    console.log("pickedUp", bookingId)
    this.inVehicle = true
    // this.updateBooking(bookingId, 'Pågående')
    this.pickedUpEvents.next(this.toObject())
  }

  delivered(bookingId) {
    console.log("delivered", bookingId)
    this.inVehicle = false
    // this.updateBooking(bookingId, 'Avklarad')
    delete this.unfilledNeeds.find((need) => need === bookingId)
    this.deliveredEvents.next(this.toObject())
  }
}

module.exports = Passenger
