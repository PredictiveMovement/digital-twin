// dispatchCentral.js

const { from, of } = require('rxjs')
const { mergeMap, catchError } = require('rxjs/operators')
const { info, error } = require('../log')

const dispatch = (fleets, bookings) => {
  return from(bookings).pipe(
    mergeMap((booking) => {
      const postalCode = booking.pickup.postalcode || 'unknown'
      const fleet = fleets.find(
        (f) =>
          f.postalCodes.includes(postalCode.substring(0, 2)) &&
          f.recyclingTypes.includes(booking.recyclingType)
      )

      if (!fleet) {
        //info(
        //  `❌ Ingen fleet hittades för postnummer ${postalCode} och recyclingType ${booking.recyclingType}`
        //)
        return of(booking)
      }

      return fleet.handleBooking(booking)
    }),
    catchError((err) => {
      error(`Fel vid tilldelning av bokning:`, err)
      return of(null)
    })
  )
}

module.exports = {
  dispatch,
}
