const EventEmitter = require('events')
const { from, shareReplay, Subject, ReplaySubject, mergeAll } = require('rxjs')
const { map, filter, reduce, partition} = require('rxjs/operators')
const Fleet = require('./fleet')

const shuffle = (arr) => arr.sort(arr => arr.sort((a, b) => Math.random() - 0.5))

class Kommun extends EventEmitter {
  constructor({ geometry, name, id, email, zip, telephone, postombud, squares, fleets }) {
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
    this.population = this.squares.pipe(reduce((a, b) => a + b.population, 0))

    this.fleets = fleets.map(({name, marketshare}) => new Fleet({name, marketshare, cars: this.cars}))
    this.bookings = this.unhandledBookings.pipe(
      map(booking => ({booking, seed: Math.random()})),
      map(({seed, booking}) => ({booking, fleet: shuffle(this.fleets).first(f => f.marketshare < seed)})),
      map(({fleet, booking}) => fleet.handleBooking(booking)),
      shareReplay()
    )

  }
}

module.exports = Kommun