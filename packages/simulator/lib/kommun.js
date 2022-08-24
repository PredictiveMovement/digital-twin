const {
  from,
  shareReplay,
  share,
  Subject,
  ReplaySubject,
  mergeMap,
  merge,
  of,
  range,
} = require('rxjs')
const {
  map,
  catchError,
  toArray,
  reduce,
  mapTo,
  groupBy,
} = require('rxjs/operators')
const Fleet = require('./fleet')
const Car = require('./vehicles/car')
const Bus = require('./vehicles/bus')
const Taxi = require('./vehicles/taxi')
const { randomize } = require('../simulator/address')
const { safeId } = require('./id')
const dynamicRatio = 0.2
// expand fleets so that a fleet with marketshare 12% has 12 cars to choose from
const expandFleets = () => (fleets) =>
  fleets.pipe(
    mergeMap((fleet) => range(0, fleet.marketshare * 10).pipe(mapTo(fleet)))
  )

// pick a random item in an array-like stream
const pickRandom = () => (stream) =>
  stream.pipe(
    toArray(),
    map((arr) => arr[Math.floor(arr.length * Math.random())])
  )

class Kommun {
  constructor({
    geometry,
    name,
    id,
    packageVolumes,
    email,
    zip,
    center,
    telephone,
    postombud,
    population,
    busesPerCapita,
    squares,
    fleets,
    busCount,
  }) {
    this.squares = squares
    this.geometry = geometry
    this.name = name
    this.id = id
    this.email = email
    this.zip = zip
    this.center = center
    this.telephone = telephone
    this.postombud = postombud
    this.packageVolumes = packageVolumes
    this.unhandledBookings = new Subject()
    this.busesPerCapita = 60 / 80_000
    this.population = population
    this.privateCars = new ReplaySubject()
    this.busCount =
      busCount || Math.max(5, Math.round(this.population * this.busesPerCapita))

    this.co2 = 0

    this.fleets = from(fleets.map((fleet) => new Fleet(fleet)))

    this.cars = merge(
      this.privateCars,
      this.fleets.pipe(mergeMap((fleet) => fleet.cars))
    ).pipe(shareReplay())

    const nrOfTaxis = Math.floor(dynamicRatio * this.busCount)

    this.taxis = range(0, nrOfTaxis).pipe(
      mergeMap(() => Promise.all([randomize(center), randomize(center)]), 5),
      // wander around until a booking comes along
      map(
        ([position, heading]) => new Taxi({ id: safeId(), position, heading })
      )
    )

    this.buses = range(0, this.busCount - nrOfTaxis).pipe(
      map(() => ({
        position: center,
        heading: center,
        kommun: name,
        stops: from([]),
      })),
      map((props) => new Bus(props))
    )

    this.dispatchedBookings = this.fleets.pipe(
      mergeMap((fleet) => fleet.dispatchedBookings),
      catchError((error) => {
        console.log(error)
        return of(false)
      }),
      shareReplay()
    )
  }

  handleBooking(booking) {
    booking.kommun = this
    this.fleets
      .pipe(
        expandFleets(), // otherwise pick one at random
        pickRandom()
      )
      .subscribe((fleet) => fleet.handleBooking(booking))

    if (booking.finalDestination?.position) {
      booking.once('delivered', () => {
        booking.pickup = booking.destination
        booking.destination = booking.finalDestination

        // Create a private car to pickup the package from the nearestOmbud
        // https://transportstyrelsen.se/sv/vagtrafik/statistik/Statistik-over-koldioxidutslapp/statistik-over-koldioxidutslapp-2020/
        const weight = 1500
        const co2perkm = 125 // gram
        const privateCar = new Car({
          position: booking.destination.position,
          weight,
          capacity: 2,
          co2PerKmKg: co2perkm / 1000 / weight,
        })
        privateCar.handleBooking(booking)
        this.privateCars.next(privateCar)
      })
    }
    return booking
  }
}

module.exports = Kommun
