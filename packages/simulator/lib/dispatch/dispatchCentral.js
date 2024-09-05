const { mergeAll, from } = require('rxjs')
const {
  tap,
  filter,
  delay,
  mergeMap,
  catchError,
  bufferTime,
  retryWhen,
  toArray,
} = require('rxjs/operators')
const { info, error, warn, debug } = require('../log')
const { clusterPositions } = require('../kmeans')

const dispatch = (cars, bookings) => {
  return cars.pipe(
    toArray(),
    tap((cars) => info(`🚚 Dispatch ${cars.length} vehicles`)),
    tap((cars) => {
      if (!cars.length) {
        warn('Fleet has no cars, dispatch is not possible.')
      }
    }),
    filter((cars) => cars.length > 0), // TODO: Move this check to the caller.
    tap((cars) => {
      const fleet = cars[0].fleet.name
      info(`🚚 Dispatch ${cars.length} vehicles in ${fleet}`)
    }),
    filter((cars) => cars.length > 0),
    mergeMap((cars) =>
      bookings.pipe(
        filter((booking) => !booking.car),
        bufferTime(5000, null, 100),
        filter((b) => b.length > 0),
        //mergeMap((bookings) => getVroomPlan(cars, bookings)),
        mergeMap(async (bookings) => {
          if (bookings.length < cars.length) {
            return [
              {
                car: cars[0],
                bookings,
              },
            ]
          }

          const clusters = await clusterPositions(bookings, cars.length)
          return clusters.map(({ items: bookings }, i) => ({
            car: cars[i],
            bookings,
          }))
        }),
        catchError((err) => error('cluster err', err)),
        mergeAll(),
        filter(({ bookings }) => bookings.length > 0),
        tap(({ car, bookings }) =>
          debug(
            `Plan ${car.id} (${car.fleet.name}) received ${bookings.length} bookings`
          )
        ),
        mergeMap(({ car, bookings }) =>
          from(bookings).pipe(
            mergeMap((booking) => car.handleBooking(booking), 1)
          )
        ),
        // tap((bookings) => info('dispatched', bookings)),
        retryWhen((errors) =>
          errors.pipe(
            tap((err) => error('dispatch error, retrying in 1s...', err)),
            delay(1000)
          )
        )
      )
    ),
    catchError((err) => error('dispatchCentral -> dispatch', err))
  )
}

module.exports = {
  dispatch,
}
