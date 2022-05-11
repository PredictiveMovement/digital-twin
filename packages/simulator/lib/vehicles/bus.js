const Booking = require('../booking')
const Vehicle = require('./vehicle')
const { take } = require('rxjs/operators')

// TODO: create this somewhere else as real fleet
const lanstrafiken = {
  name: 'Länstrafiken i Norrbotten',
}

class Bus extends Vehicle {
  constructor({ position, stops, ...vehicle }) {
    super({ position, stops, fleet: lanstrafiken, ...vehicle })
    stops.subscribe(({ position: pickup }) => {
      this.handleBooking(
        new Booking({
          pickup: { position: pickup },
          dropOff: { position },
        })
      )
    })
  }
}

module.exports = Bus
