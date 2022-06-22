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
  constructor({ position, lineNumber, id, stops, ...vehicle }) {
    super({
      position,
      id,
      stops,
      fleet: lanstrafiken,
      ...vehicle,
    })
    this.lineNumber = lineNumber
    if (lineNumber === '50') {
      stops
        .pipe(toArray())
        .subscribe((stops) => console.log('init bus id', id, 'stops', stops))
    }
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
    if (this.id === '252500000000000378') {
      console.log('QUEUE BUS', this.id)
      console.log(
        this.queue.map((b) => ({
          pickup: `${b.pickup.stopName} ${b.pickup.departureTime}`,
          destination: `${b.destination.stopName} ${b.destination.arrivalTime}`,
        }))
      )
    }
    this.booking = this.booking || this.queue.shift()
    this.status = 'Delivery' // WHY? CL Did not finish explaining
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
    if (!this.booking) {
      this.simulate(false)
      return
    }
    return this.navigateTo(this.booking.destination.position) // resume simulation
  }

  // dropOff() {
  //   super.dropOff()
  //   if (this.id === '9011025022600000') {
  //     console.log('DROPOFF BUS', this.id)
  //     console.log(
  //       this.queue.map((b) => ({
  //         pickup: `${b.pickup.stopName} ${b.pickup.departureTime}`,
  //         destination: `${b.destination.stopName} ${b.destination.arrivalTime}`,
  //       }))
  //     )
  //   }

  //   this.booking = this.queue.shift()
  // }
}

module.exports = Bus
