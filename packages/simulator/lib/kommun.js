const EventEmitter = require('events')
const { from, shareReplay, Subject, ReplaySubject } = require('rxjs')
const { map, filter, reduce } = require('rxjs/operators')


class Kommun extends EventEmitter {
  constructor({ geometry, name, id, email, zip, telephone, postombud, squares }) {
    super()
    this.squares = squares
    this.geometry = geometry
    this.name = name
    this.id = id
    this.email = email
    this.zip = zip
    this.telephone = telephone
    this.postombud = postombud
    this.unhandledBookings = new Subject()
    this.cars = new ReplaySubject()
    this.bookings = new ReplaySubject()
    this.population = this.squares.pipe(reduce((a, b) => a + b.population, 0))
    this.fleets = [
      {
        name: 'Postnord',
        market: 0.6
      },
      {
        name: 'Schenker',
        market: 0.18
      },
      {
        name: 'Bring',
        market: 0.06
      },
      {
        name: 'DHL',
        market: 0.06
      }
    ]
  }
}

module.exports = Kommun