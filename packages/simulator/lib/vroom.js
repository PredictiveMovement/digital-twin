const fetch = require('node-fetch')
// eslint-disable-next-line no-undef
const vroomUrl = process.env.VROOM_URL || 'https://vroom.predictivemovement.se/'
const moment = require('moment')
const { debug, error, info } = require('./log')
const { getFromCache, updateCache } = require('./cache')
const queue = require('./queueSubject')

module.exports = {
  bookingToShipment({ id, pickup, destination }, i) {
    return {
      id: i,
      //description: id,
      amount: [1],
      pickup: {
        time_windows: pickup.departureTime?.length
          ? [
              [
                moment(pickup.departureTime, 'hh:mm:ss').unix(),
                moment(pickup.departureTime, 'hh:mm:ss')
                  .add(5, 'minutes')
                  .unix(),
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
  },
  taxiToVehicle({ position, passengerCapacity, heading, passengers }, i) {
    return {
      id: i,
      //description: id,
      capacity: [Math.max(1, passengerCapacity - (passengers?.length || 0))], // HACK: sometimes we will arrive here with -1 or 0 in capacity - we should fix that
      start: [position.lon, position.lat],
      end: heading ? [heading.lon, heading.lat] : undefined,
    }
  },
  truckToVehicle({ position, parcelCapacity, heading, cargo }, i) {
    return {
      id: i,
      //description: id,
      time_window: [
        moment('05:00:00', 'hh:mm:ss').unix(),
        moment('18:00:00', 'hh:mm:ss').unix(),
      ],
      capacity: [parcelCapacity - cargo.length],
      start: [position.lon, position.lat],
      end: heading ? [heading.lon, heading.lat] : undefined,
    }
  },
  async plan({ jobs, shipments, vehicles }) {
    const result = await getFromCache({ jobs, shipments, vehicles })
    if (result) {
      info('Vroom cache hit')
      return result
    }
    debug('Vroom cache miss')

    const before = Date.now()

    return await queue(() =>
      fetch(vroomUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobs,
          shipments,
          vehicles,
          options: {
            plan: true,
          },
        }),
      })
        .then(async (res) =>
          !res.ok ? Promise.reject('Vroom error:' + (await res.text())) : res
        )
        .then((res) => res.json())
        .then((json) =>
          Date.now() - before > 10_000
            ? updateCache({ jobs, shipments, vehicles }, json) // cache when it takes more than 10 seconds
            : json
        )
        .catch((vroomError) => {
          error(`Vroom error: ${vroomError} (enable debug logging for details)`)
          info('Jobs', jobs.length)
          info('Shipments', shipments.length)
          info('Vehicles', vehicles.length)
          return vroomError
        })
    )
  },
}
