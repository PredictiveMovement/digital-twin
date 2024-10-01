// vroom.js

const fetch = require('node-fetch')
const vroomUrl = process.env.VROOM_URL || 'https://vroom.telge.iteam.pub/'
const moment = require('moment')
const { debug, error, info } = require('./log')
const { getFromCache, updateCache } = require('./cache')
const queue = require('./queueSubject')

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const skillMap = {}
let nextSkillId = 1

function getSkillId(recyclingType) {
  if (!skillMap[recyclingType]) {
    skillMap[recyclingType] = nextSkillId++
  }
  return skillMap[recyclingType]
}

const vroom = (module.exports = {
  bookingToShipment(booking, i) {
    return {
      id: i,
      amount: [1],
      skills: [getSkillId(booking.recyclingType)],
      pickup: {
        id: i,
        location: [booking.pickup.position.lon, booking.pickup.position.lat],
      },
      delivery: {
        id: i,
        location: [
          booking.destination.position.lon,
          booking.destination.position.lat,
        ],
      },
    }
  },
  truckToVehicle(vehicle, i) {
    return {
      id: i,
      time_window: [
        moment('05:00:00', 'hh:mm:ss').unix(),
        moment('18:00:00', 'hh:mm:ss').unix(),
      ],
      capacity: [vehicle.parcelCapacity - vehicle.cargo.length],
      start: [vehicle.position.lon, vehicle.position.lat],
      skills: vehicle.recyclingTypes.map(getSkillId),
    }
  },
  async plan({ jobs, shipments, vehicles }) {
    const maxVehiclesPerBatch = 200
    const maxShipmentsPerBatch = 500

    const totalVehicles = vehicles.length
    const totalShipments = shipments.length

    const numBatches = Math.ceil(
      Math.max(
        totalVehicles / maxVehiclesPerBatch,
        totalShipments / maxShipmentsPerBatch
      )
    )

    const allResults = { routes: [], summary: {} }

    for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
      const batchVehicles = vehicles.slice(
        batchIndex * maxVehiclesPerBatch,
        (batchIndex + 1) * maxVehiclesPerBatch
      )
      const batchShipments = shipments.slice(
        batchIndex * maxShipmentsPerBatch,
        (batchIndex + 1) * maxShipmentsPerBatch
      )

      if (batchVehicles.length === 0 || batchShipments.length === 0) continue

      const cacheKey = {
        jobs,
        shipments: batchShipments,
        vehicles: batchVehicles,
      }
      const result = await getFromCache(cacheKey)
      if (result) {
        debug('Vroom cache hit for batch', batchIndex)
        allResults.routes.push(...result.routes)
        continue
      }

      debug('Vroom cache miss for batch', batchIndex)
      const before = Date.now()

      try {
        const res = await queue(() =>
          fetch(vroomUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jobs,
              shipments: batchShipments,
              vehicles: batchVehicles,
              options: {
                plan: true,
              },
            }),
          })
        )

        if (!res.ok) {
          throw new Error('Vroom error:' + (await res.text()))
        }

        const json = await res.json()

        if (Date.now() - before > 10_000) {
          await updateCache(cacheKey, json)
        }

        allResults.routes.push(...json.routes)
        Object.assign(allResults.summary, json.summary)
      } catch (vroomError) {
        error(
          `Vroom error in batch ${batchIndex}: ${vroomError} (enable debug logging for details)`
        )
        info('Shipments', batchShipments.length)
        info('Vehicles', batchVehicles.length)
        continue
      }
    }

    return allResults
  },
})
