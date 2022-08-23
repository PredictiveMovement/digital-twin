const {
  toArray,
  mergeMap,
  groupBy,
  mergeAll,
  filter,
  take,
  takeLast,
} = require('rxjs/operators')
const moment = require('moment')
const { plan } = require('./vroom')
const { from } = require('rxjs')

const correctTime = (time) => time.replace(/^24:/, '00:')
const unix = (str) => moment(correctTime(str), 'HH:mm:ss').unix()

const tripToShipment = ({ tripId, firstStop, lastStop }, i) => ({
  id: i,
  description: tripId,
  amount: [1],
  pickup: {
    time_windows: [
      [unix(firstStop.arrivalTime), unix(firstStop.departureTime) + 1],
    ],
    id: i,
    location: [firstStop.position.lon, firstStop.position.lat],
  },
  delivery: {
    id: i,
    location: [lastStop.position.lon, lastStop.position.lat],
    time_windows: [
      [unix(lastStop.arrivalTime), unix(lastStop.departureTime) + 1],
    ],
  },
})

const busToVehicle = ({ id, position, capacity, heading }, i) => ({
  id: i,
  description: id,
  capacity: [capacity],
  start: [position.lon, position.lat],
  speed_factor: 1.2,
  end: heading ? [heading.lon, heading.lat] : undefined,
})

/**
 * Take two streams- buses and trips
 * Pass them to VROOM and get back assignments:
 *   Array of:
 *     bus: Object(Bus)
 *     trips: Array of trips including each stop
 * @param {*} buses
 * @param {*} trips
 * @returns { assigned, unassigned}
 */

const busDispatch = async (buses, trips) => {
  const shipments = trips.map(tripToShipment)

  console.log(
    'calling vroom with',
    buses.length,
    'buses',
    shipments.length,
    'trips'
  )

  const result = await plan({
    shipments: shipments,
    vehicles: buses.map(busToVehicle),
  })

  return result.routes.map((route) => ({
    bus: buses.find(({ id }) => id === route.description),
    trips: route.steps
      .filter((s) => s.type === 'pickup')
      .map((step) => trips[step.id]),
  }))
  const unassigned = result.unassigned
    .filter((s) => s.type === 'pickup')
    .map((step) => trips[step.id])
}

module.exports = {
  busDispatch,
}
