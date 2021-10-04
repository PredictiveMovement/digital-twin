const EventEmitter = require('events')
const { from, shareReplay, Subject, ReplaySubject, mergeAll, mergeMap, of, range } = require('rxjs')
const { map, tap, filter, catchError, toArray, reduce, partition, first, mapTo } = require('rxjs/operators')
const Fleet = require('./fleet')


// expand fleets so that a fleet with marketshare 12% has 12 cars to choose from
const expandFleets = () => (fleets) => fleets.pipe(mergeMap(fleet => range(0, fleet.marketshare * 10).pipe(mapTo(fleet))))

// pick a random item in an array-like stream
const pickRandom = () => stream => stream.pipe(toArray(), map((arr) => arr[Math.floor(arr.length * Math.random())]))

class Kommun extends EventEmitter {
  constructor({ geometry, name, id, packageVolumes, email, zip, telephone, postombud, squares, fleets }) {
    super()
    this.squares = squares
    this.geometry = geometry
    this.name = name
    this.id = id
    this.email = email
    this.zip = zip
    this.telephone = telephone
    this.postombud = postombud
    this.packageVolumes = packageVolumes
    this.unhandledBookings = new Subject()
    this.population = this.squares.pipe(reduce((a, b) => a + b.population, 0))

    this.fleets = from(fleets.map(({ hub, name, marketshare, numberOfCars }) => new Fleet({ hub, name, marketshare, numberOfCars })))
    this.cars = this.fleets.pipe(
      mergeMap(fleet => fleet.cars),
      shareReplay()
    )

    this.dispatchedBookings = this.fleets.pipe(
      mergeMap(fleet => fleet.dispatchedBookings),
//      tap(booking => console.log('dispatched', booking)),
      catchError(error => {
        console.log(error)
        return of(false)
      }),
      shareReplay()
    )
  }

  handleBooking(booking) {
    booking.kommun = this
    this.fleets.pipe(
      first(f => f.name === booking.origin, null), // first try to use origin if it exists
      mergeMap(fleet => fleet ? of(fleet) : this.fleets.pipe(
        expandFleets(), // otherwise pick one at random
        pickRandom(),
      ))
    ).subscribe(fleet => fleet.handleBooking(booking))
    return booking
  }
}

module.exports = Kommun
