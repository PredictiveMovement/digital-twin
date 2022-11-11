const fetch = require('node-fetch')
// eslint-disable-next-line no-undef
const vroomUrl = process.env.VROOM_URL || 'https://vroom.predictivemovement.se/'
const moment = require('moment')

const computeTimeWindow = (location) => {
    if (!location?.timeWindow?.length) {
      return undefined
    }
    return [
      [
        moment(location.timeWindow[0]).unix(),
        moment(location.timeWindow[1]).add(5, 'minutes').unix(),
      ],
    ]
  }

module.exports = {
  bookingToShipment({ id, pickup, destination }, i) {
    return {
      id: i,
      description: id,
      amount: [1],
      pickup: {
        id: i,
        location: [pickup.position.lon, pickup.position.lat],
        time_windows: computeTimeWindow(pickup),
      },
      delivery: {
        id: i,
        location: [destination.position.lon, destination.position.lat],
        time_windows: computeTimeWindow(destination),
      },
    }
  },
  taxiToVehicle({ id, position, passengerCapacity, heading, bookings }, i) {
    return {
      id: i,
      description: id,
      capacity: [passengerCapacity],
      start: [position.lon, position.lat],
      end: heading ? [heading.lon, heading.lat] : undefined,
    }
  },
  async plan({ jobs, shipments, vehicles }) {
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
