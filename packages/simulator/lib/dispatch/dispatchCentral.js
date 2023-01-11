const { mergeAll, timer, of, from } = require('rxjs')
const {
  map,
  tap,
  filter,
  delay,
  mergeMap,
  catchError,
  scan,
  debounceTime,
  bufferTime,
  switchMap,
  concatMap,
  retryWhen,
  toArray,
  bufferCount,
} = require('rxjs/operators')
const { info, error, warn } = require('../log')
const { clusterPositions } = require('../kmeans')
const { haversine } = require('../distance')
const { truckToVehicle, bookingToShipment, plan } = require('../vroom')
const moment = require('moment')

const takeNearest = (cars, center, count) =>
  cars
    .sort((a, b) => {
      const aDistance = haversine(a.position, center)
      const bDistance = haversine(b.position, center)
      return aDistance - bDistance
    })
    .slice(0, count)

const getVroomPlan = async (cars, bookings) => {
  const vehicles = cars.map(truckToVehicle)
  const shipments = bookings.map(bookingToShipment) // TODO: concat bookings from existing vehicles with previous assignments
  info('Calling vroom dispatch', vehicles.length, shipments.length)
  const result = await plan({ shipments, vehicles })

  return result.routes.map((route) => {
    return {
      car: cars.find(({ id }) => id === route.description),
      bookings: route.steps
        .filter((s) => s.type === 'pickup')
        .flatMap((step) => {
          const booking = bookings[step.id]
          return booking
        }),
    }
  })
}

const dispatch = (cars, bookings) => {
  return cars.pipe(
    toArray(),
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
        bufferTime(5000),
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
        tap((plans) => info('plans', plans.length)),
        mergeAll(),
        filter(({ bookings }) => bookings.length > 0),
        tap(({ car, bookings }) =>
          info(
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
