// __tests__/dispatch.test.js

const fs = require('fs')
const path = require('path')
const { from } = require('rxjs')
const { toArray } = require('rxjs/operators')
const Booking = require('../../lib/models/booking') // Justera sökvägen efter din struktur
const { reverseSearch } = require('../../lib/pelias') // Anta att du har en Pelias-modul

// Läs in bokningarna från JSON-filen
const loadBookings = () => {
  const bookingsData = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../data/bookings.json'))
  )

  // Ta de första 100 bokningarna
  return bookingsData.slice(0, 100).map((data) => new Booking(data))
}

describe('Clustering Tests', () => {
  it('should return postal code for a given location', async () => {
    // Define the test coordinates
    const lat = 59.334591
    const lon = 18.06324

    // Perform the reverse search and expect the postal code
    const postalCode = await reverseSearch(lat, lon)

    // Log the result (optional)
    console.log(`Postal code for location (${lat}, ${lon}) is: ${postalCode}`)

    // Assert that the postal code is what you expect
    expect(postalCode).toBeDefined() // Modify this line based on the actual postal code you're expecting
  })
})
