const { from, of } = require('rxjs')
const { mergeMap, catchError } = require('rxjs/operators')
const { info, error } = require('../log')

const dispatch = (fleets, bookings) => {
  return from(bookings).pipe(
    mergeMap((booking) => {
      const postalCode = booking.pickup.postalcode || 'unknown'
      const fleet = fleets.find((f) => f.postalCodes.includes(postalCode))

      if (!fleet) {
        info(`❌ Ingen fleet hittades för postnummer ${postalCode}`)
        return of(booking)
      }

      //info(`🎯 Tilldelar bokning ${booking.id} till fleet ${fleet.name}`)
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
