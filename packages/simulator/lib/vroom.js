const fetch = require('node-fetch')
// eslint-disable-next-line no-undef
const vroomUrl = process.env.VROOM_URL || 'https://vroom.telge.iteam.pub/'
const moment = require('moment')
const { debug, error, info } = require('./log')
const { getFromCache, updateCache } = require('./cache')
const queue = require('./queueSubject')

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const vroom = (module.exports = {
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
  truckToVehicle({ position, parcelCapacity, destination, cargo }, i) {
    return {
      id: i,
      //description: id,
      time_window: [
        moment('05:00:00', 'hh:mm:ss').unix(),
        moment('18:00:00', 'hh:mm:ss').unix(),
      ],
      capacity: [parcelCapacity - cargo.length],
      start: [position.lon, position.lat],
      end: destination ? [destination.lon, destination.lat] : undefined,
    }
  },
  async plan({ jobs, shipments, vehicles }) {
    if (shipments.length > 500) throw new Error('Too many shipments to plan')
    if (vehicles.length > 200) throw new Error('Too many vehicles to plan')
    //if (vehicles.length < 2) throw new Error('Need at least 2 vehicles to plan')

    const result = await getFromCache({ jobs, shipments, vehicles })
    if (result) {
      debug('Vroom cache hit')
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
          info('Jobs', jobs?.length)
          info('Shipments', shipments?.length)
          info('Vehicles', vehicles?.length)
          return delay(2000).then(() =>
            vroom.plan({ jobs, shipments, vehicles })
          )
        })
    )
  },
})
