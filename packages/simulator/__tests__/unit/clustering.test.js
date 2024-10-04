// __tests__/clustering.test.js

const fs = require('fs')
const path = require('path')
const { from, take, mergeMap, map, distinct } = require('rxjs')
const { toArray, tap } = require('rxjs/operators')
const Booking = require('../../lib/models/booking')
const { reverseSearch } = require('../../lib/pelias')
const {
  addPostalCode,
  groupBookingsByPostalCode,
  calculateCenters,
  clusterByPostalCode,
} = require('../../lib/clustering')
const telge = require('../../streams/orders/telge')
const { te } = require('date-fns/locale')

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

describe('Count unique postal codes', () => {
  it('should count unique postal codes from bookings', (done) => {
    // Load the bookings using the read function
    telge
      .pipe(
        // Extract postal codes from each booking
        map((booking) => booking.pickup.postalcode),

        // Ensure only unique postal codes are counted
        distinct(),

        // Collect all the distinct postal codes into an array
        toArray()
      )
      .subscribe({
        next: (uniquePostalCodes) => {
          console.log(`Unique postal codes:`, uniquePostalCodes)

          // Log the total number of unique postal codes
          console.log(
            `Total number of unique postal codes:`,
            uniquePostalCodes.length
          )

          // Perform your test assertions
          expect(uniquePostalCodes.length).toBeGreaterThan(0) // Example: Ensure there's at least one postal code
          done()
        },
        error: (err) => {
          console.error(
            'Error loading bookings or extracting postal codes:',
            err
          )
          done(err)
        },
      })
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

describe('Integration Test - Load and Cluster Bookings', () => {
  it('should load bookings and cluster them by postal code', (done) => {
    telge
      .pipe(
        take(5), // Take only the first 5 bookings
        mergeMap((booking) => addPostalCode(booking)), // Add postal code to each booking
        toArray(), // Collect all bookings into an array
        mergeMap((bookings) => clusterByPostalCode(from(bookings))) // Group bookings by postal code
      )
      .subscribe({
        next: (clusteredBooking) => {
          // Each `clusteredBooking` is an instance of `ClusteredBookings`
          console.log(`Cluster for postal code ${clusteredBooking.postalCode}:`)
          //console.log('Center:', clusteredBooking.center)

          // Subscribe to the stream of bookings within each cluster
          clusteredBooking.bookings.subscribe({
            complete: () => {
              /*console.log(
                `Completed processing cluster ${clusteredBooking.postalCode}`
              )*/
            },
          })
        },
        error: (err) => {
          console.error('Error during clustering:', err)
          done(err)
        },
        complete: () => {
          console.log('Clustering process completed for all bookings.')
          done()
        },
      })
  })
})

describe('Integration Test - Count Clusters', () => {
  it('should count how many different clusters (postal codes) exist', (done) => {
    jest.setTimeout(10000) // Increase timeout to 10 seconds for this test

    telge
      .pipe(
        mergeMap((booking) => addPostalCode(booking)), // Add postal code to each booking
        toArray(), // Collect all bookings into an array
        mergeMap((bookings) => clusterByPostalCode(from(bookings))), // Group bookings by postal code
        toArray() // Collect all clusters into an array
      )
      .subscribe({
        next: (clusters) => {
          console.log(`Total number of clusters: ${clusters.length}`)

          // Perform test assertion
          expect(clusters.length).toBeGreaterThan(0) // Ensure there is at least 1 cluster

          done()
        },
        error: (err) => {
          console.error('Error during clustering:', err)
          done(err)
        },
      })
  })
})

describe('Integration Test - Postal Code and Booking Counts', () => {
  let uniquePostalCodeCount = 0
  let totalBookingsCount = 0
  let clusters = []

  // Step 1: Count unique postal codes and total bookings
  it('should count unique postal codes and total bookings', (done) => {
    jest.setTimeout(10000) // Increase timeout to 10 seconds for this test
    telge
      .pipe(
        tap(() => totalBookingsCount++), // Increment total bookings count
        map((booking) => booking.pickup.postalcode), // Extract postal codes
        distinct(), // Ensure postal codes are unique
        toArray() // Collect unique postal codes into an array
      )
      .subscribe({
        next: (uniquePostalCodes) => {
          uniquePostalCodeCount = uniquePostalCodes.length // Save unique postal code count
          console.log(`Unique postal codes count: ${uniquePostalCodeCount}`)
          done()
        },
        error: (err) => {
          console.error('Error during postal code counting:', err)
          done(err)
        },
      })
  })

  // Step 2: Create clusters
  it('should create clusters by postal code', (done) => {
    telge
      .pipe(
        take(totalBookingsCount), // Use total bookings count for clustering
        mergeMap((booking) => addPostalCode(booking)), // Add postal code to each booking
        toArray(), // Collect all bookings into an array
        mergeMap((bookings) => clusterByPostalCode(from(bookings))), // Group bookings by postal code
        toArray() // Collect clusters into an array
      )
      .subscribe({
        next: (clusteredBookings) => {
          clusters = clusteredBookings // Save clusters for later assertions
          console.log(`Total number of clusters: ${clusters.length}`)
          done()
        },
        error: (err) => {
          console.error('Error during clustering:', err)
          done(err)
        },
      })
  })

  // Step 3: Verify that number of clusters matches unique postal codes
  it('should assert that number of clusters matches the number of unique postal codes', () => {
    expect(clusters.length).toBe(uniquePostalCodeCount) // Assert that the number of clusters is the same as the number of unique postal codes
    console.log(
      `Number of clusters: ${clusters.length} matches unique postal codes: ${uniquePostalCodeCount}`
    )
  })

  // Step 4: Count and list all the bookings for each cluster and verify total
  it('should count and list bookings for each cluster', (done) => {
    let totalClusteredBookingsCount = 0

    from(clusters)
      .pipe(
        mergeMap((cluster) => {
          return cluster.bookings.pipe(
            toArray(), // Collect all bookings in the cluster
            tap((bookings) => {
              totalClusteredBookingsCount += bookings.length // Increment the total number of clustered bookings
              console.log(
                `Number of bookings for postal code ${cluster.postalCode}: ${bookings.length}`
              )
            })
          )
        }),
        toArray() // Ensure we process all clusters
      )
      .subscribe({
        next: () => {
          // Verify the total number of bookings matches the total loaded initially
          expect(totalClusteredBookingsCount).toBe(totalBookingsCount)
          console.log(
            `Total bookings in all clusters: ${totalClusteredBookingsCount}`
          )
          console.log(`Total bookings loaded initially: ${totalBookingsCount}`)
          done()
        },
        error: (err) => {
          console.error('Error counting bookings for clusters:', err)
          done(err)
        },
      })
  })
})
