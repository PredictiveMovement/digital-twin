const { mergeMap, merge, Subject } = require('rxjs')
const { filter, share, catchError } = require('rxjs/operators')
const { error } = require('./log')

class Region {
  constructor({ id, name, geometry, municipalities }) {
    this.id = id
    this.geometry = geometry
    this.name = name
    this.municipalities = municipalities

    /**
     * Vehicle streams.
     */

    this.cars = municipalities.pipe(
      mergeMap((municipality) => municipality.cars)
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
      )
    ).pipe(share())
  }
}

module.exports = Region
