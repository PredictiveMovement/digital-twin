// __tests__/clustering.test.js

const fs = require('fs')
const path = require('path')
const { from, take, mergeMap } = require('rxjs')
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
        postalCode: 'Distinct1',
        bookings: [
          new Booking({
            id: 'test-booking-1',
            pickup: { position: { lat: 10.0, lon: 20.0 } }, // Point 1
          }),
          new Booking({
            id: 'test-booking-2',
            pickup: { position: { lat: 30.0, lon: 40.0 } }, // Point 2
          }),
        ],
      },
      {
        postalCode: 'Distinct2',
        bookings: [
          new Booking({
            id: 'test-booking-3',
            pickup: { position: { lat: -10.0, lon: -20.0 } }, // Point 3
          }),
          new Booking({
            id: 'test-booking-4',
            pickup: { position: { lat: -30.0, lon: -40.0 } }, // Point 4
          }),
        ],
      },
      {
        postalCode: 'PlusSignCluster',
        bookings: [
          new Booking({
            id: 'plus-1',
            pickup: { position: { lat: 50.0, lon: 0.0 } }, // Top
          }),
          new Booking({
            id: 'plus-2',
            pickup: { position: { lat: 0.0, lon: 50.0 } }, // Right
          }),
          new Booking({
            id: 'plus-3',
            pickup: { position: { lat: -50.0, lon: 0.0 } }, // Bottom
          }),
          new Booking({
            id: 'plus-4',
            pickup: { position: { lat: 0.0, lon: -50.0 } }, // Left
          }),
        ],
      },
      {
        postalCode: 'SinglePointCluster',
        bookings: [
          new Booking({
            id: 'single-1',
            pickup: { position: { lat: 100.0, lon: 200.0 } }, // Single point
          }),
        ],
      },
    ]

    calculateCenters(from(groups)).subscribe((groupCenters) => {
      expect(groupCenters.length).toBe(4) // We expect 4 groups

      // First group (Distinct1)
      const center1 = groupCenters.find(
        (g) => g.postalCode === 'Distinct1'
      ).center
      expect(center1.lat).toBeCloseTo(20.0, 6) // Average of 10.0 and 30.0
      expect(center1.lon).toBeCloseTo(30.0, 6) // Average of 20.0 and 40.0

      // Second group (Distinct2)
      const center2 = groupCenters.find(
        (g) => g.postalCode === 'Distinct2'
      ).center
      expect(center2.lat).toBeCloseTo(-20.0, 6) // Average of -10.0 and -30.0
      expect(center2.lon).toBeCloseTo(-30.0, 6) // Average of -20.0 and -40.0

      // Third group (PlusSignCluster)
      const center3 = groupCenters.find(
        (g) => g.postalCode === 'PlusSignCluster'
      ).center
      expect(center3.lat).toBeCloseTo(0.0, 6) // Average of 50.0, 0.0, -50.0, 0.0
      expect(center3.lon).toBeCloseTo(0.0, 6) // Average of 0.0, 50.0, 0.0, -50.0

      // Fourth group (SinglePointCluster)
      const center4 = groupCenters.find(
        (g) => g.postalCode === 'SinglePointCluster'
      ).center
      expect(center4.lat).toBeCloseTo(100.0, 6) // Exact values since there's only one point
      expect(center4.lon).toBeCloseTo(200.0, 6)

      done()
    })
  })
})

describe('Integration Test - Load and Process Telge Bookings', () => {
  it('should load bookings, add postal codes, cluster them, and calculate centers', (done) => {
    telge
      .pipe(
        take(3),
        mergeMap((booking) => {
          // Ensure each booking has a postal code
          if (booking.pickup.postalcode) {
            return from([booking])
          } else {
            return addPostalCode(booking)
          }
        }),
        toArray(),
        mergeMap((bookings) => {
          console.log('--- Loaded Bookings with Postal Codes ---')
          bookings.forEach((booking) => {
            console.log(`Booking ID: ${booking.id}`)
            console.log(`  Postal Code: ${booking.pickup.postalcode}`)
            console.log(
              `  Position: (${booking.pickup.position.lat}, ${booking.pickup.position.lon})`
            )
            console.log(`  Recycling Type: ${booking.recyclingType}`)
            console.log('----------------------------------------')
          })
          return groupBookingsByPostalCode(from(bookings))
        }),
        mergeMap((groups) => {
          console.log('\n--- Grouped Bookings by Postal Code ---')
          groups.forEach((group) => {
            console.log(`Postal Code: ${group.postalCode}`)
            console.log(`  Number of Bookings: ${group.bookings.length}`)
            group.bookings.forEach((booking) => {
              console.log(`    Booking ID: ${booking.id}`)
            })
            console.log('--------------------------------------')
          })
          return calculateCenters(groups)
        })
      )
      .subscribe(
        (groupCenters) => {
          console.log('\n--- Calculated Centers of Clusters ---')
          groupCenters.forEach((group) => {
            console.log(`Postal Code: ${group.postalCode}`)
            console.log(
              `  Center Position: (${group.center.lat}, ${group.center.lon})`
            )
            console.log(`  Number of Bookings: ${group.bookings.length}`)
            console.log('--------------------------------------')
          })
        },
        (err) => {
          console.error('Error during integration test:', err)
          done(err) // Fail the test
        },
        () => {
          console.log('\nIntegration test completed.')
          done() // Finish the test
        }
      )
  })
})
