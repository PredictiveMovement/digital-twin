const fetch = require('node-fetch')
// eslint-disable-next-line no-undef
const vroomUrl = process.env.VROOM_URL || 'https://vroom.predictivemovement.se/'
const moment = require('moment')
const { debug } = require('./log')

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
      capacity: [passengerCapacity - passengers.length],
      start: [position.lon, position.lat],
      end: heading ? [heading.lon, heading.lat] : undefined,
    }
  },
  truckToVehicle({ id, position, parcelCapacity, heading, cargo }, i) {
    return {
      id: i,
      description: id,
      capacity: [parcelCapacity - cargo.length],
      start: [position.lon, position.lat],
      end: heading ? [heading.lon, heading.lat] : undefined,
    }
  },
  async plan({ jobs, shipments, vehicles }) {
    debug(
      `Call Vroom with ${jobs?.length || 0} jobs, ${
        shipments?.length || 0
      } shipments and ${vehicles?.length || 0} vehicles`
    )
    return await fetch(vroomUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobs,
        shipments,
        vehicles,
      }),
    })
      .then(async (res) =>
        !res.ok ? Promise.reject('Vroom error:' + (await res.text())) : res
      )
      .then((res) => res.json())
  },
}
