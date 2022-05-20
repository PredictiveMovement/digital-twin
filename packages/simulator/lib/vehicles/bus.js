const Booking = require('../booking')
const Vehicle = require('./vehicle')
const { take, pairwise, map, finalize } = require('rxjs/operators')
const moment = require('moment')
const { virtualTime } = require('../virtualTime')

// TODO: create this somewhere else as real fleet
const lanstrafiken = {
  name: 'Länstrafiken i Norrbotten',
}

class Bus extends Vehicle {
  constructor({ position, stops, ...vehicle }) {
    super({ position, stops, fleet: lanstrafiken, ...vehicle })
    stops
      .pipe(
        pairwise(),
        map(([pickup, destination]) => {
          console.log('***START***')
          console.log(pickup.departureTime)
          console.log(destination.departureTime)
          console.log('***END***')
          if (this.id === '252500000000000733') {
            console.log('handling booking for 733', pickup.departureTime)
          }

          this.handleBooking(
            new Booking({
              // pickup and destination contains both position and arrival and departure time
              pickup,
              destination,
            })
          )
        }),
        finalize(() => {
          this.emit('ready', this)
          console.log('finalize')
        })
      )
      .subscribe(() => {})
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
    this.simulate(false) // pause interpolation while we wait

    if (this.id === '252500000000000733') {
      console.log('***Start***')
      console.log('starting bus with id ', '252500000000000733')
      console.log(moment(booking.pickup.departureTime, 'hh:mm:ss'))
      console.log(moment(this.time()))
      console.log(moment.duration(waitTime).humanize())
      console.log('*** END ***')
    }
    if (waitTime > 0) await this.wait(waitTime)

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
