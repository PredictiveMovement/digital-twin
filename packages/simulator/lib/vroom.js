const fetch = require('node-fetch')
// eslint-disable-next-line no-undef
const vroomUrl = process.env.VROOM_URL || 'https://vroom.predictivemovement.se/'
const moment = require('moment')
const { error, debug } = require('./log')

module.exports = {
  bookingToShipment({ id, pickup, destination }, i) {
    return {
      id: i,
      description: id,
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
  taxiToVehicle({ id, position, passengerCapacity, heading, passengers }, i) {
    return {
      id: i,
      description: id,
      capacity: [passengerCapacity - (passengers?.length || 0)],
      start: [position.lon, position.lat],
      end: heading ? [heading.lon, heading.lat] : undefined,
    }
  },
  truckToVehicle({ id, position, parcelCapacity, heading, cargo }, i) {
    return {
      id: i,
      description: id,
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
    const vehicle =
      (vehicles?.length || 0) === 1
        ? vehicles[0].description
        : vehicles?.length || 0
    const logInfo = `(📍 ${jobs?.length || 0}, 📦 ${
      shipments?.length || 0
    }, 🚚 ${vehicle})`
    const logger = setInterval(() => {
      debug('Calling Vroom', logInfo)
    }, 2000)

    return await fetch(vroomUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobs,
        shipments,
        vehicles: vehicles.filter((v) => {
          if (!v.capacity) {
            return true
          }

          return v.capacity[0] > 0
        }),
        options: {
          plan: true,
        },
      }),
    })
      .then(async (res) =>
        !res.ok ? Promise.reject('Vroom error:' + (await res.text())) : res
      )
      .then((res) => {
        clearInterval(logger)
        return res.json()
      })
      .catch((vroomError) => {
        error(
          `Vroom error: ${vroomError} (enable debug logging for details)`,
          logInfo
        )
        debug('Jobs', jobs)
        debug('Shipments', shipments)
        debug('Vehicles', vehicles)
        return Promise.reject(vroomError)
      })
  },
}
