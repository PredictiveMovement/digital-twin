const { toArray, map, filter, mergeMap, take } = require('rxjs/operators')
const { plan } = require('../vroom')
const moment = require('moment')

const bookingToShipment = ({ id, pickup, destination }, i) => ({
  id: i,
  description: id,
  amount: [1],
  pickup: {
    time_windows: pickup.timeWindow?.length
      ? [
          [
            moment(pickup.timeWindow[0]).unix(),
            moment(pickup.timeWindow[1]).unix() + 1,
          ],
        ]
      : undefined,
    id: i,
    location: [pickup.position.lon, pickup.position.lat],
  },
  delivery: {
    id: i,
    location: [destination.position.lon, destination.position.lat],
    time_windows: destination.timeWindow?.length
      ? [
          [
            moment(destination.timeWindow[0]).unix(),
            moment(destination.timeWindow[1]).unix() + 1,
          ],
        ]
      : undefined,
  },
})
const taxiToVehicle = ({ id, position, capacity, heading, bookings }, i) => ({
  id: i,
  description: id,
  capacity: [capacity],
  start: [position.lon, position.lat],
  end: heading ? [heading.lon, heading.lat] : undefined,
})

const taxiDispatch = async (taxis, bookings) => {
  const vehicles = taxis.map(taxiToVehicle)
  const shipments = bookings.map(bookingToShipment) // TODO: concat bookings from existing vehicles with previous assignments
  console.log('calling vroom for taxi', vehicles.length, shipments.length)
  const result = await plan({ shipments, vehicles })

  return result.routes.map((route) => {
    return {
      taxi: taxis.find(({ id }) => id === route.description),
      bookings: route.steps
        .filter((s) => s.type === 'pickup')
        .flatMap((step) => bookings[step.id]),
    }
  })
}

module.exports = {
  taxiDispatch,
}
