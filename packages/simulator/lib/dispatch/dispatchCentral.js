const { from, EMPTY } = require('rxjs')
const { tap, filter, mergeMap, catchError, toArray } = require('rxjs/operators')
const { info, error, warn, debug } = require('../log')

const dispatch = (cars, bookings) => {
  return cars.pipe(
    toArray(),
    tap((cars) => info(`🚚 Dispatching ${cars.length} vehicles`)),
    tap((cars) => {
      if (!cars.length) {
        warn('Fleet has no cars, dispatch is not possible.')
      }
    }),
    filter((cars) => cars.length > 0),
    mergeMap((carsArray) => {
      // Create a map of cars for quick lookup
      const carMap = new Map(carsArray.map((car) => [car.carId, car]))
      return bookings.pipe(
        filter((booking) => !booking.car), // Filter out bookings that already have a car
        mergeMap((booking) => {
          const car = carMap.get(booking.carId)
          if (car) {
            // Check if the car can handle the booking
            if (
              car.canHandleBooking(booking) &&
              !car.queue.find((b) => b.id === booking.id)
            ) {
              return from(car.handleBooking(booking)).pipe(
                tap(() =>
                  debug(`📦 Booking ${booking.id} assigned to car ${car.id}`)
                ),
                catchError((err) => {
                  error(
                    `Error handling booking ${booking.id} with car ${car.id}`,
                    err
                  )
                  return EMPTY
                })
              )
            } else {
              warn(`🚫 Car ${car.id} cannot handle booking ${booking.id}`)
              return EMPTY
            }
          } else {
            warn(
              `🚫 No car found with carId ${booking.carId} for booking ${booking.id}`
            )
            return EMPTY
          }
        }),
        catchError((err) => {
          error('Error in dispatching bookings', err)
          return EMPTY
        })
      )
    }),
    catchError((err) => {
      error('dispatchCentral -> dispatch', err)
      return EMPTY
    })
  )
}

module.exports = {
  dispatch,
}
