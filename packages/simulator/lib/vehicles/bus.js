const Booking = require('../booking')
const Vehicle = require('./vehicle')
const { take, pairwise, map } = require('rxjs/operators')
const moment = require('moment')
const { virtualTime } = require('../virtualTime')

// TODO: create this somewhere else as real fleet
const lanstrafiken = {
  name: 'Länstrafiken i Norrbotten',
}

class Bus extends Vehicle {
  constructor({ position, stops, ...vehicle }) {
    super({ position, stops, fleet: lanstrafiken, ...vehicle })
    this.routeHasStarted = false

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
    let booking
    if (this.routeHasStarted) {
      booking = this.queue.shift()
    } else {
      booking = this.booking
      console.log('bus starts trip', booking.car.id)
      this.routeHasStarted = true
    }
    if (!booking) {
      this.simulate(false)
      return
    }

    //   console.log(this.queue.length)
    booking.pickedUp(this.position)
    this.cargo.push(booking)

    this.emit('cargo', this)
    const departure = moment(booking.pickup.departureTime, 'hh:mm:ss')
    const waitTime = departure.subtract(moment(this.time())).valueOf()
    this.simulate(false) // pause interpolation while we wait

    if (waitTime > 0) await this.wait(waitTime)
    console.log(
      '*** Navigating bus ',
      booking.car.id,
      ' is navigating to ',
      booking.destination.stopName
    )
    return this.navigateTo(booking.destination.position) // resume simulation
  }

  // Wait using the virtual time.
  wait(time) {
    //console.log(
    //  `*** bus #${this.id} waits ${Math.round(time / 1000 / 60)} min...`
    //)
    return virtualTime.setTimeout(time)
  }
}

module.exports = Bus
