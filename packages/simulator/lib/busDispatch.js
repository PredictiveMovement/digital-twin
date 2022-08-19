const {
  bufferCount,
  toArray,
  map,
  filter,
  tap,
  mergeMap,
  take,
  groupBy,
} = require('rxjs/operators')
const moment = require('moment')
const { plan } = require('./vroom')

const correctTime = (time) => time.replace(/^24:/, '00:')

const stopToShipment = (
  [
    {
      tripId, //: '252500000000000101',
      arrivalTime: pickupArrivalTime, //: '17:33:49',
      departureTime: pickupDepartureTime, //: '17:33:49',
      position: pickupPosition,
    },
    {
      arrivalTime: deliveryArrivalTime, //: '17:33:49',
      departureTime: deliveryDepartureTime, //: '17:33:49',
      position: deliveryPosition,
    },
  ],
  i
) => ({
  id: i,
  description: tripId,
  amount: [1],
  pickup: {
    time_windows: [
      [
        moment(correctTime(pickupArrivalTime), 'HH:mm:ss').valueOf() / 1000,
        moment(correctTime(pickupDepartureTime), 'HH:mm:ss').valueOf() / 1000 +
          1,
      ],
    ],
    id: i,

    location: [pickupPosition.lon, pickupPosition.lat],
  },
  delivery: {
    id: i,
    location: [deliveryPosition.lon, deliveryPosition.lat],
    time_windows: [
      [
        moment(correctTime(deliveryArrivalTime), 'HH:mm:ss').valueOf() / 1000,
        moment(correctTime(deliveryDepartureTime), 'HH:mm:ss').valueOf() /
          1000 +
          1,
      ],
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

const busDispatch = (buses, stops) =>
  stops.pipe(
    toArray(),
    mergeMap((stopsArray) =>
      buses.pipe(
        toArray(),
        mergeMap(async (buses) => {
          const firstAndLasts = stopsArray.map((trip) => [
            trip[0],
            trip[trip.length - 1],
          ])
          const stopsByTripMap = stopsArray.reduce((acc, curr) => {
            acc[curr[0].tripId] = curr
            return acc
          }, {})

          console.log(
            'calling vroom with',
            buses.length,
            'buses',
            firstAndLasts.length,
            'trips'
          )

          const result = await plan({
            shipments: firstAndLasts.map(stopToShipment).slice(0, 100),
            vehicles: buses.map(busToVehicle),
          })

          return result.routes.map((route, index) => {
            const toFirstStop = stepToBookingEntity(route.steps[0])
            const toHub = stepToBookingEntity(
              route.steps[route.steps.length - 1]
            )

            let tripIds = route.steps
              .map((step) => {
                if (step.id !== undefined) {
                  return stopsArray[step.id][0].tripId
                }
              })
              .filter((e) => e)
            tripIds = [...new Set(tripIds)]
            return {
              bus: buses[index],
              steps: [toFirstStop].concat(
                tripIds.flatMap((tripId) => stopsByTripMap[tripId]),
                [toHub]
              ),
            }
          })
        })
      )
    )
  )
const stepToBookingEntity = ({
  waiting_time,
  arrival: departureTime,
  location: [lon, lat],
}) => ({
  departureTime: moment((departureTime + waiting_time) * 1000).format(
    'HH:mm:ss'
  ),
  arrivalTime: moment((departureTime + waiting_time) * 1000).format('HH:mm:ss'),
  position: { lat, lon },
})
module.exports = {
  busDispatch,
}
