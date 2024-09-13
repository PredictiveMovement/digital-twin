const { plan, truckToVehicle, bookingToShipment } = require('../vroom')
const { error } = require('../log')

const findBestRouteToPickupBookings = async (truck, bookings) => {
  // Log the type and content of truck
  console.log('Truck dispatch:', typeof truck, truck)

  // Check if bookings is an array and log its length and content
  if (Array.isArray(bookings)) {
    console.log('Bookings dispatch: Array with length:', bookings.length)
    bookings.forEach((booking, index) => {
      console.log(`Booking [${index}]:`, formatBooking(booking))
    })
  } else {
    console.log('Bookings dispatch: Not an array, value:', bookings)
  }
  const vehicles = [truckToVehicle(truck, 0)]
  console.log(`vehicles:`, vehicles)
  const shipments = bookings.map(bookingToShipment)

  const result = await plan({ shipments, vehicles })

  if (result.unassigned?.length > 0) {
    error(`Unassigned bookings: ${result.unassigned}`)
  }

  return result.routes[0]?.steps
    .filter(({ type }) => ['pickup', 'delivery', 'start'].includes(type))
    .map(({ id, type, arrival, departure }) => {
      const booking = bookings[id]
      const instruction = {
        action: type,
        arrival,
        departure,
        booking,
      }
      return instruction
    })
}

// Helper function to format booking details for logging
function formatBooking(booking) {
  if (!booking) return 'Booking is undefined or null'
  return {
    id: booking.id,
    type: booking.type,
    pickup: {
      name: booking.pickup?.name,
      date: booking.pickup?.date,
      position: formatPosition(booking.pickup?.position),
    },
    destination: {
      name: booking.destination?.name,
      position: formatPosition(booking.destination?.position),
    },
    status: booking.status,
  }
}

// Helper function to format position details
function formatPosition(position) {
  if (!position) return 'Position not available'
  return {
    lat: position.lat,
    lon: position.lon,
  }
}

module.exports = {
  findBestRouteToPickupBookings,
}
