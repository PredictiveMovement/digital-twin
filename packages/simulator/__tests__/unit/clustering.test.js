// __tests__/dispatch.test.js

const fs = require('fs')
const path = require('path')
const { from, take } = require('rxjs')
const { toArray } = require('rxjs/operators')
const Booking = require('../../lib/models/booking')
const { reverseSearch } = require('../../lib/pelias')
const {
  addPostalCode,
  groupBookingsByPostalCode,
  calculateCenters,
} = require('../../lib/clustering')
const telge = require('../../streams/orders/telge')

/*const loadBookings = () => {
  telge // 'telge' is an observable
    .pipe(
      take(5), // Take only the first 10 bookings
      toArray() // Collect all results into an array
    )
    .subscribe((bookings) => {
      bookings.forEach((booking) => {
        const bookingInstance = new Booking(booking)
        console.log('Test LOG: ' + JSON.stringify(bookingInstance))
      })
    })
}*/

describe('Utility - reverseSearch', () => {
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

describe('Clustering - addPostalCode', () => {
  it('should add postal code to booking', (done) => {
    const booking = new Booking({
      id: 'test-booking-1',
      pickup: {
        position: { lat: 59.135449, lon: 17.571239 },
      },
    })

    addPostalCode(booking).subscribe((updatedBooking) => {
      expect(updatedBooking.pickup.postalcode).toBeDefined()
      done()
    })
  })
})

describe('Clustering - groupBookingsByPostalCode', () => {
  it('should cluster bookings by postal code', (done) => {
    const bookings = from([
      new Booking({
        id: 'test-booking-1',
        pickup: {
          postalcode: '15166',
          position: { lat: 59.135449, lon: 17.571239 },
        },
      }),
      new Booking({
        id: 'test-booking-2',
        pickup: {
          postalcode: '15166',
          position: { lat: 59.13545, lon: 17.57124 },
        },
      }),
      new Booking({
        id: 'test-booking-3',
        pickup: {
          postalcode: '15167',
          position: { lat: 59.135451, lon: 17.571241 },
        },
      }),
    ])

    groupBookingsByPostalCode(bookings).subscribe((groupedBookings) => {
      expect(groupedBookings.length).toBe(2) // Expect 2 groups
      expect(groupedBookings[0].postalCode).toBe('15166')
      expect(groupedBookings[0].bookings.length).toBe(2) // 2 bookings in the first group
      expect(groupedBookings[1].postalCode).toBe('15167')
      expect(groupedBookings[1].bookings.length).toBe(1) // 1 booking in the second group
      done()
    })
  })
})

describe('Clustering - calculateCenters', () => {
  it('should calculate the center of each booking cluster', (done) => {
    const groups = [
      {
        postalCode: '15166',
        bookings: [
          new Booking({
            id: 'test-booking-1',
            pickup: { position: { lat: 59.135449, lon: 17.571239 } },
          }),
          new Booking({
            id: 'test-booking-2',
            pickup: { position: { lat: 59.13545, lon: 17.57124 } },
          }),
        ],
      },
      {
        postalCode: '15167',
        bookings: [
          new Booking({
            id: 'test-booking-3',
            pickup: { position: { lat: 59.135451, lon: 17.571241 } },
          }),
        ],
      },
    ]

    calculateCenters(from(groups)).subscribe((groupCenters) => {
      expect(groupCenters.length).toBe(2) // 2 groups

      // Check the first group's center
      const center1 = groupCenters[0].center
      expect(center1.lat).toBeCloseTo(59.1354495, 6) // Average latitude
      expect(center1.lon).toBeCloseTo(17.5712395, 6) // Average longitude

      // Check the second group's center
      const center2 = groupCenters[1].center
      expect(center2.lat).toBeCloseTo(59.135451, 6) // Since there's only 1 booking, the center is its position
      expect(center2.lon).toBeCloseTo(17.571241, 6)

      done()
    })
  })
})
