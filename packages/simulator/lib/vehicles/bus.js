const Booking = require('../booking')
const Vehicle = require('./vehicle')
const { take, pairwise, map, toArray } = require('rxjs/operators')
const moment = require('moment')
const { virtualTime } = require('../virtualTime')

// TODO: create this somewhere else as real fleet
const lanstrafiken = {
  name: 'Länstrafiken i Norrbotten',
}

class Bus extends Vehicle {
  constructor({ position, id, stops, ...vehicle }) {
    super({ position, id, stops, fleet: lanstrafiken, ...vehicle })
    stops
      .pipe(toArray())
      .subscribe((stops) => console.log('init bus id', id, 'stops', stops))
    stops
      .pipe(
        pairwise(),
        map(([pickup, destination]) => {
          this.handleBooking(
            new Booking({
              // pickup and destination contains both position and arrival and departure time
              pickup,
              destination,
            })
          )
        })
      )
      .subscribe(() => {})
  }

  // This is called when the bus arrives at each stop. Let's check if the departure time
  // is in the future. If it is, we wait until the departure time.
  async pickup() {
    this.booking = this.booking || this.queue.shift()
    if (!this.booking) {
      this.simulate(false)
      return
    }

    //   console.log(this.queue.length)
    this.booking.pickedUp(this.position)
    this.cargo.push(this.booking)

    this.emit('cargo', this)
    const departure = moment(
      this.booking.pickup.departureTime,
      'hh:mm:ss'
    ).valueOf()
    this.simulate(false) // pause interpolation while we wait
    const waitingtime = moment(departure).diff(moment(virtualTime.time()))
    if (waitingtime > 0) await virtualTime.waitUntil(departure)
    return this.navigateTo(this.booking.destination.position) // resume simulation
  }
}

module.exports = Bus
