const { ReplaySubject, from } = require('rxjs')

class ClusteredBookings {
  constructor(postalCode, center, bookings) {
    this.postalCode = postalCode
    this.center = center
    this.bookings = bookings // Assign the stream directly, no need for manual adding
  }
}

module.exports = ClusteredBookings
