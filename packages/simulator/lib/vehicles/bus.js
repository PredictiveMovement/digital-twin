const Booking = require('../booking')
const Vehicle = require('./vehicle')
const { take, pairwise } = require('rxjs/operators')

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
          pickup,
          destination
        })
      )
    })
  }
}

module.exports = Bus
