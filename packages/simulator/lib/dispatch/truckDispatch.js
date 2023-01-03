const { plan, truckToVehicle, bookingToShipment } = require('../vroom')
const moment = require('moment')
const { info } = require('../log')

const findBestRouteToPickupBookings = async (taxi, bookings) => {
  const vehicles = [truckToVehicle(taxi, 0)]
  const shipments = bookings.map(bookingToShipment)

  const result = await plan({ shipments, vehicles })

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

module.exports = {
  findBestRouteToPickupBookings,
}
