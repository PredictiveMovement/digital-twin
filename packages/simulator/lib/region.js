const { from, mergeMap, merge, Subject, of } = require('rxjs')
const {
  map,
  groupBy,
  tap,
  filter,
  mergeAll,
  share,
  toArray,
  catchError,
  shareReplay,
  first,
} = require('rxjs/operators')
const { isInsideCoordinates } = require('../lib/polygon')
const { error } = require('./log')
const Booking = require('./models/booking')

const flattenProperty = (property) => (stream) =>
  stream.pipe(
    mergeMap((object) =>
      object[property].pipe(
        toArray(),
        map((arr) => ({
          ...object,
          [property]: arr,
        }))
      )
    )
  )

class Region {
  constructor({ id, name, geometry, municipalities }) {
    this.id = id
    this.geometry = geometry
    this.name = name
    this.municipalities = municipalities

    /**
     * Static map objects.
     */

    this.postombud = municipalities.pipe(
      mergeMap((municipality) => municipality.postombud)
    )

    /**
     * Vehicle streams.
     */

    this.cars = municipalities.pipe(
      mergeMap((municipality) => municipality.cars)
    )

    this.recycleTrucks = municipalities.pipe(
      mergeMap((municipality) => municipality.recycleTrucks),
      catchError((err) => error('recycle trucks err', err))
    )

    this.recycleCollectionPoints = municipalities.pipe(
      mergeMap((municipality) => municipality.recycleCollectionPoints),
      catchError((err) => error('recycleCollectionPoints err', err))
    )

    /**
     * Transportable objects streams.
     */

    this.citizens = municipalities.pipe(
      mergeMap((municipality) => municipality.citizens)
    )

    this.manualBookings = new Subject()

    this.unhandledBookings = this.citizens.pipe(
      mergeMap((passenger) => passenger.bookings),
      filter((booking) => !booking.assigned),
      catchError((err) => error('unhandledBookings', err)),
      share()
    )

    this.dispatchedBookings = merge(
      this.municipalities.pipe(
        mergeMap((municipality) => municipality.dispatchedBookings)
      ),
      this.municipalities.pipe(
        mergeMap((municipality) => municipality.fleets),
        mergeMap((fleet) => fleet.dispatchedBookings)
      )
    ).pipe(share())
  }
}

module.exports = Region
