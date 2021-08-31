const { Subject } = require('rxjs')
const { dispatch } = require('./dispatchCentral')

class Fleet {
  constructor({name, marketshare, cars}) {
    this.name = name
    this.marketshare = marketshare
    this.cars = cars
    this.unhandledBookings = new Subject()
    this.bookings = dispatch(this.cars, this.unhandledBookings)
  }

  handleBooking(booking) {
    booking.fleet = this
    this.unhandledBookings.next(booking)
    return booking
  }
}

module.exports = Fleet