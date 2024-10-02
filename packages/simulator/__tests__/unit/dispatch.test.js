// __tests__/dispatch.test.js

const fs = require('fs')
const path = require('path')
const { from, take } = require('rxjs')
const { toArray } = require('rxjs/operators')
const Booking = require('../../lib/models/booking')
const { reverseSearch } = require('../../lib/pelias')
const telge = require('../../streams/orders/telge')

const loadBookings = () => {
  telge // 'telge' is an observable
    .pipe(
      take(2), // Take only the first 10 bookings
      toArray() // Collect all results into an array
    )
    .subscribe((bookings) => {
      bookings.forEach((booking) => {
        const bookingInstance = new Booking(booking)
        console.log('Test LOG: ' + JSON.stringify(bookingInstance))
      })
    })
}

describe('Clustering Tests', () => {
  it('should return postal code for a given location', async () => {
    // Define the test coordinates
    const lat = 59.135449
    const lon = 17.571239

    // Perform the reverse search and expect the postal code
    const postalCode = await reverseSearch(lat, lon)

    // Log the result
    console.log(`Postal code for location (${lat}, ${lon}) is: ${postalCode}`)

    // Assert that the postal code is what you expect
    expect(postalCode).toBeDefined()
  })
})

describe('Booking Tests', () => {
  it('should load bookings from JSON file', () => {
    loadBookings()
  })
})
