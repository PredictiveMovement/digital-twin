const { from } = require('rxjs')
const osrm = require('./osrm')
const extractPoints = require('./extractPoints')
const { map, mergeMap, finalize, last, concatWith, concatMap, withLatestFrom } = require('rxjs/operators')

class Car {
  constructor(id, position, pool) {
    this.id = id
    this.start_position = position // TODO: Update position after dropoff, so future booking start from right place
    this.pool = pool
  }

  handleBookings(bookings, time_offset = 0) {
    const generators = bookings.map(b => {
      return (time) => this._handleBooking(b, time)
    })
    return from(generators).pipe(
      concatMap(generator => {
        const events$ = generator(time_offset)
        events$
          .pipe(last())
          .subscribe(e => { time_offset += e.time })
        return events$
      }),
      finalize(() => {
        this.pool.make_available(this)
      })
    )
  }

  _handleBooking(booking, time_offset) {
    console.debug(`car#${this.id} handle_booking booking_id:${booking.id} time_offset ${time_offset}`)

    const pickupRoute$ = from(osrm.route(this.start_position, booking.departure))
      .pipe(
        mergeMap(extractPoints),
        map(point => ({ type: 'car:position', /*position: point.position, car_id: this.id,*/ time: time_offset + point.passed })),
      )

    const pickupEvent$ = pickupRoute$.pipe(
      last(),
      map(event => {
        // TODO: How long should it take to from arriving at the package's position to next departure?
        return { type: 'car:pickup', position: event.position, car_id: this.id, time: event.time, booking_id: booking.id }
      })
    )

    const dropoffRoute$ = from(osrm.route(booking.departure, booking.destination))
      .pipe(
        mergeMap(extractPoints),
        withLatestFrom(pickupEvent$),
        map(([point, loadEvent]) => (
          { type: 'car:position', /*position: point.position, car_id: this.id,*/ time: point.passed + loadEvent.time, passed: point.passed }
        )),
      )

    const deliverEvent$ = dropoffRoute$.pipe(
      last(),
      map(event => {
        // TODO: Currently takes 0 time to pick a package up
        return { type: 'car:deliver', position: event.position, car_id: this.id, time: event.time, booking_id: booking.id }
      })
    )

    return pickupRoute$.pipe(
      concatWith(
        pickupEvent$,
        dropoffRoute$,
        deliverEvent$,
      ),
      finalize(() => {
        // console.log(`${booking.id} is done`)
      })
    )
  }
}

module.exports = Car
