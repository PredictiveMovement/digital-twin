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

module.exports = {
  addPostalCode,
  groupBookingsByPostalCode,
  calculateCenters,
  clusterByPostalCode,
}
