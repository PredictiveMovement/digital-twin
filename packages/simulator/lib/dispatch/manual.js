const { mergeAll, from } = require('rxjs')
const { tap, filter, mergeMap, catchError, toArray } = require('rxjs/operators')
const { info, error, warn, debug } = require('../log')

// Define the dispatch function that processes a stream of bookings in order
const dispatch = (cars, bookings) => {
  return cars.pipe(
    toArray(),
    tap((cars) => info(`🚚 Dispatch ${cars.length} vehicles`)),
    tap((cars) => {
      if (!cars.length) {
        warn('Fleet has no cars, dispatch is not possible.')
      }
    }),
    filter((cars) => cars.length > 0), // Ensure cars exist
    tap((cars) => {
      const fleet = cars[0].fleet.name
      info(`🚚 Dispatch ${cars.length} vehicles in ${fleet}`)
    }),
    mergeMap((cars) =>
      // Process each car
      from(cars).pipe(
        mergeMap((car) => {
          let currentBookingIndex = 0 // Start with the first booking in the stream

          return bookings.pipe(
            filter((_, index) => index === currentBookingIndex), // Get the next booking in order
            mergeMap((booking) => {
              if (!booking) {
                warn(`No booking found in the stream for car ${car.id}`)
                return [] // If no booking found, skip processing
              }

              // Assign the booking to the car
              info(
                `Dispatching booking ${booking.id} to car ${car.id} at ${car.position}`
              )

              // Increment to process the next booking in the next iteration
              currentBookingIndex++
              return from([car.handleBooking(booking)]) // Call handleBooking on the car
            }, 1) // Ensure bookings are processed one by one
          )
        }),
        mergeAll()
      )
    ),
    catchError((err) => error('dispatchCentral -> dispatch', err))
  )
}

module.exports = {
  dispatch,
}
