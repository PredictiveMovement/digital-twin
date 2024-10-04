// lib/clustering.js

const { from } = require('rxjs')
const { map, mergeMap, groupBy, toArray } = require('rxjs/operators')
const { reverseSearch } = require('./pelias')
const Booking = require('./models/booking')
const ClusteredBookings = require('./models/clusteredBookings')
const { haversine } = require('./distance')
const { info } = require('./log') // Add this line to import the info function

function addPostalCode(booking) {
  return from(
    (async () => {
      const { lat, lon } = booking.pickup.position
      const postalCode = await reverseSearch(lat, lon)
      booking.pickup.postalcode = postalCode
      return booking
    })()
  )
}

function groupBookingsByPostalCode(bookings) {
  return bookings.pipe(
    groupBy((booking) => booking.pickup.postalcode),
    mergeMap((group$) =>
      group$.pipe(
        toArray(),
        map((bookings) => ({ postalCode: group$.key, bookings }))
      )
    ),
    toArray()
  )
}

// Calculate the center of each cluster of bookings
function calculateCenters(groups) {
  return from(groups).pipe(
    // För varje grupp av bokningar
    map(({ postalCode, bookings }) => {
      const total = bookings.length
      // Beräkna medelvärdet för latitud och longitud
      const sumPosition = bookings.reduce(
        (acc, booking) => {
          acc.lat += booking.pickup.position.lat
          acc.lon += booking.pickup.position.lon
          return acc
        },
        { lat: 0, lon: 0 }
      )
      const center = {
        lat: sumPosition.lat / total,
        lon: sumPosition.lon / total,
      }
      return { postalCode, center, bookings }
    }),
    toArray()
  )
}

function clusterByPostalCode(bookings) {
  return bookings.pipe(
    groupBy((booking) => booking.pickup.postalcode), // Group by postal code
    mergeMap((group$) => {
      const postalCode = group$.key

      // Calculate the center of the group of bookings
      return group$.pipe(
        toArray(),
        map((groupedBookings) => {
          const total = groupedBookings.length
          const sumPosition = groupedBookings.reduce(
            (acc, booking) => {
              acc.lat += booking.pickup.position.lat
              acc.lon += booking.pickup.position.lon
              return acc
            },
            { lat: 0, lon: 0 }
          )

          const center = {
            lat: sumPosition.lat / total,
            lon: sumPosition.lon / total,
          }

          // Create a ClusteredBookings object with a stream of bookings
          return new ClusteredBookings(
            postalCode,
            center,
            from(groupedBookings)
          )
        })
      )
    })
  )
}

function divideIntoClusters(bookings) {
  info('Startar klusterindelning av bokningar...')

  return bookings.pipe(
    toArray(),
    map((allBookings) => {
      info(`Totalt antal bokningar att klustra: ${allBookings.length}`)

      const MAX_ITERATIONS = 100
      const CONVERGENCE_THRESHOLD = 0.0001
      const NUM_CLUSTERS = 50

      // Förbered data
      const bookingsWithDistances = allBookings.map((booking) => ({
        booking,
        position: [booking.pickup.position.lat, booking.pickup.position.lon],
      }))

      // Initiera kluster med slumpmässiga centroider
      let clusters = Array(NUM_CLUSTERS)
        .fill()
        .map(() => ({
          centroid:
            bookingsWithDistances[
              Math.floor(Math.random() * bookingsWithDistances.length)
            ].position,
          bookings: [],
        }))

      function squaredDistance(pos1, pos2) {
        return Math.pow(pos1[0] - pos2[0], 2) + Math.pow(pos1[1] - pos2[1], 2)
      }

      let iteration = 0
      let changed = true
      while (changed && iteration < MAX_ITERATIONS) {
        changed = false
        iteration++

        // Rensa bokningar från föregående iteration
        clusters.forEach((cluster) => (cluster.bookings = []))

        // Tilldela bokningar till närmaste kluster
        bookingsWithDistances.forEach(({ booking, position }) => {
          let nearestCluster = clusters.reduce(
            (nearest, cluster, index) => {
              const distance = squaredDistance(position, cluster.centroid)
              return distance < nearest.distance ? { index, distance } : nearest
            },
            { index: -1, distance: Infinity }
          )

          clusters[nearestCluster.index].bookings.push(booking)
        })

        // Uppdatera centroider och beräkna total förändring
        let totalMovement = 0
        clusters.forEach((cluster) => {
          if (cluster.bookings.length > 0) {
            const newCentroid = cluster.bookings
              .reduce(
                (sum, booking) => {
                  sum[0] += booking.pickup.position.lat
                  sum[1] += booking.pickup.position.lon
                  return sum
                },
                [0, 0]
              )
              .map((coord) => coord / cluster.bookings.length)

            totalMovement += squaredDistance(cluster.centroid, newCentroid)
            cluster.centroid = newCentroid
          } else {
            // Om ett kluster är tomt, placera det slumpmässigt igen
            const randomBooking =
              bookingsWithDistances[
                Math.floor(Math.random() * bookingsWithDistances.length)
              ]
            cluster.centroid = randomBooking.position
            totalMovement += 1 // Säkerställ att loopen fortsätter
          }
        })

        changed = totalMovement > CONVERGENCE_THRESHOLD
      }

      // Skapa ClusteredBookings objekt
      const clusteredBookings = clusters.map(
        (cluster, index) =>
          new ClusteredBookings(
            `Cluster-${index}`,
            { lat: cluster.centroid[0], lon: cluster.centroid[1] },
            from(cluster.bookings)
          )
      )

      return clusteredBookings
    }),
    mergeMap(from) // Flatten the array of ClusteredBookings into a stream
  )
}

module.exports = {
  addPostalCode,
  groupBookingsByPostalCode,
  calculateCenters,
  clusterByPostalCode,
  divideIntoClusters,
}
