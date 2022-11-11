const moment = require('moment')

const { plan, taxiToVehicle, bookingToShipment } = require('../vroom')
const { info } = require('../log')

const taxiDispatch = async (taxis, bookings) => {
  const vehicles = taxis.map(taxiToVehicle)
  const shipments = bookings.map(bookingToShipment) // TODO: concat bookings from existing vehicles with previous assignments
  info('Calling vroom for taxi', vehicles.length, shipments.length)
  const result = await plan({ shipments, vehicles })

  return result.routes.map((route) => {
    return {
      taxi: taxis.find(({ id }) => id === route.description),
      bookings: route.steps
        .filter((s) => s.type === 'pickup')
        .flatMap((step) => {
          const booking = bookings[step.id]
          booking.pickup.departureTime = moment(step.arrival).format('hh:mm:ss')
          return booking
        }),
    }
  })
}

const findBestRouteToPickupBookings = async (taxi, bookings) => {
  const vehicles = [taxiToVehicle(taxi, 0)]
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
  taxiDispatch,
  findBestRouteToPickupBookings,
}
