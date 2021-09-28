const EventEmitter = require('events')
const { from, shareReplay, Subject, ReplaySubject, mergeAll, merge, of } = require('rxjs')
const { map, tap, filter, reduce, partition, first } = require('rxjs/operators')
const Fleet = require('./fleet')

const shuffle = (arr) => arr.sort((a, b) => Math.random() - 0.5)
const randomFleet = (fleets) => shuffle(fleets).find(f => f.marketshare > Math.random()) || fleets[0]

/*
kommun.fleets.reduce((acc, curr) => { 
    prevEnd = acc[acc.length - 1]?.end || 0.0
    return [...acc, { 
    name: curr.name, 
    start: prevEnd,
    end: prevEnd + curr.market
    }]
})

pick = (sel, n) => { let i = 0; 
    while (i < n) { 
        ++i; 
        let r = Math.random(0.0, sel[sel.length-1].end);  // pick last end as max instead of assuming it sums to 1.0
        sel.filter(({ start, end }) => (start <= r && r < end))
            .forEach(a => console.log(a.name)) 
    }
}
*/

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
    this.population = this.squares.pipe(reduce((a, b) => a + b.population, 0))

    this.fleets = from(fleets.map(({ hub, name, marketshare, numberOfCars }) => new Fleet({ hub, name, marketshare, numberOfCars })))
    this.cars = this.fleets.pipe(
      map(fleet => fleet.cars),
      mergeAll(),
      shareReplay()
    )

    this.dispatchedBookings = this.fleets.pipe(
      map(fleet => fleet.dispatchedBookings),
      mergeAll(),
      tap(booking => console.log('dispatched', booking.id)),
      shareReplay()
    )
  }

  handleBooking(booking) {
    booking.kommun = this
    this.fleets.pipe(first()).subscribe(fleet => fleet.handleBooking(booking))
    return booking
  }
}

module.exports = Kommun
