const { toArray, map, filter, mergeMap, take } = require('rxjs/operators')
const { plan } = require('../vroom')
const moment = require('moment')

const bookingToShipment = ({ id, pickup, destination }, i) => {
  return {
    id: i,
    description: id,
    amount: [1],
    pickup: {
      time_windows: pickup.departureTime?.length
        ? [
            [
              moment(pickup.departureTime, 'hh:mm:ss').unix(),
              moment(pickup.departureTime, 'hh:mm:ss').add(5, 'minutes').unix(),
            ],
          ]
        : undefined,
      id: i,
      location: [pickup.position.lon, pickup.position.lat],
    },
    delivery: {
      id: i,
      location: [destination.position.lon, destination.position.lat],
      time_windows: destination.arrivalTime?.length
        ? [
            [
              moment(destination.arrivalTime, 'hh:mm:ss').unix(),
              moment(destination.arrivalTime, 'hh:mm:ss')
                .add(5, 'minutes')
                .unix(),
            ],
          ]
        : undefined,
    },
  }
}
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
        .flatMap((step) => {
          const booking = bookings[step.id]
          booking.pickup.departureTime = moment(step.arrival).format('hh:mm:ss')
          return booking
        }),
    }
  })
}

module.exports = {
  taxiDispatch,
}
