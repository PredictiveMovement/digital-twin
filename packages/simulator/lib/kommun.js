const EventEmitter = require('events')
const { from, shareReplay, Subject, ReplaySubject, mergeMap, merge, of, range } = require('rxjs')
const { map, tap, filter, catchError, toArray, reduce, mapTo } = require('rxjs/operators')
const Fleet = require('./fleet')
const Car = require('./vehicles/car')


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
    this.privateCars = new ReplaySubject()

    this.fleets = from(fleets.map((fleet) => new Fleet(fleet)))
    this.cars = merge(this.privateCars, this.fleets.pipe(
      mergeMap(fleet => fleet.cars),
      shareReplay()
    ))

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
      expandFleets(), // otherwise pick one at random
      pickRandom(),
    ).subscribe(fleet => fleet.handleBooking(booking))

    if (booking.finalDestination?.position) {
      booking.once('delivered', () => {

        booking.pickup = booking.destination
        booking.destination = booking.finalDestination

        // Create a private car to pickup the package from the nearestOmbud
        // https://transportstyrelsen.se/sv/vagtrafik/statistik/Statistik-over-koldioxidutslapp/statistik-over-koldioxidutslapp-2020/
        const privateCar = new Car({position: booking.destination.position, weight: 1500, capacity: 2, co2PerKmKg: 0.008 / 1000})
        privateCar.handleBooking(booking)
        this.privateCars.next(privateCar)
      })
    }
    return booking
  }
}

module.exports = Kommun
