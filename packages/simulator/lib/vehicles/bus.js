const Booking = require('../booking')
const Vehicle = require('./vehicle')
const { take, pairwise } = require('rxjs/operators')
const moment = require('moment')
const { virtualTime } = require('../virtualTime')

// TODO: create this somewhere else as real fleet
const lanstrafiken = {
  name: 'Länstrafiken i Norrbotten',
}

class Bus extends Vehicle {
  constructor({ position, stops, ...vehicle }) {
    super({ position, stops, fleet: lanstrafiken, ...vehicle })
    stops.pipe(
      pairwise()
    ).subscribe(([pickup, destination]) => {
      this.handleBooking(
        new Booking({
          // pickup and destination contains both position and arrival and departure time
          pickup,
          destination,
        })
      )
    })
  }

  // This is called when the bus arrives at each stop. Let's check if the departure time
  // is in the future. If it is, we wait until the departure time.
  async pickup() {
    const booking = this.booking || this.queue.shift()
    booking.pickedUp(this.position)
    this.cargo.push(booking)
    this.emit('cargo', this)
    const departure = moment(booking.pickup.departureTime, 'hh:mm:ss')
    const waitTime = departure.subtract(moment(this.time())).valueOf()
    if (waitTime > 0) await this.wait(waitTime)
    return this.navigateTo(booking.destination.position)
  }

  // Wait using the virtual time.
  wait(time) {
    console.log(`*** bus #${this.id} waits ${time}...`)
    return virtualTime.setTimeout(time).then(() => {
      console.log(`*** bus #${this.id} continues...`)
    })
  }
}

module.exports = Bus
