const { toArray, mergeMap, groupBy, mergeAll } = require('rxjs/operators')
const moment = require('moment')
const { plan } = require('./vroom')

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
  end: heading ? [heading.lon, heading.lat] : undefined,
})

const busDispatch = (buses, trips) =>
  trips.pipe(
    toArray(),
    mergeMap((trips) =>
      buses.pipe(
        toArray(),
        mergeMap(async (buses) => {
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
        })
      )
    ),
    mergeAll()
  )

module.exports = {
  busDispatch,
}
