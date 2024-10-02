// dispatchCentral.js

const { from, of } = require('rxjs')
const { mergeMap, catchError } = require('rxjs/operators')
const { info, error } = require('../log')

const dispatch = (fleets, bookings) => {
  return from(bookings).pipe(
    mergeMap((booking) => {
      return of(booking)
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
