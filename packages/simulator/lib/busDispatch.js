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

const stopToShipment = (
  {
    first: {
      tripId, //: '252500000000000101',
      arrivalTime: pickupArrivalTime, //: '17:33:49',
      departureTime: pickupDepartureTime, //: '17:33:49',
      position: pickupPosition,
    },
    last: {
      arrivalTime: deliveryArrivalTime, //: '17:33:49',
      departureTime: deliveryDepartureTime, //: '17:33:49',
      position: deliveryPosition,
    },
  },
  i
) => ({
  id: i,
  description: tripId,
  amount: [1],
  pickup: {
    time_windows: [
      [
        moment(pickupArrivalTime, 'HH:mm:ss').valueOf() / 1000,
        moment(pickupDepartureTime, 'HH:mm:ss').valueOf() / 1000 + 1,
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
        moment(deliveryArrivalTime, 'HH:mm:ss').valueOf() / 1000,
        moment(deliveryDepartureTime, 'HH:mm:ss').valueOf() / 1000 + 1,
      ],
    ],
  },
})

const busToVehicle = ({ id, position, capacity, heading }, i) => ({
  id: i,
  description: id,
  capacity: [capacity],
  start: [position.lon, position.lat],
  end: heading ? [heading.lat, heading.lon] : undefined,
})

const busDispatch = (buses, stops) =>
  // console.log(
  //   'PLAN PLEASE',
  //   JSON.stringify(passengers.map(passengerToShipment), null, 2)
  // )
  stops.pipe(
    toArray(),
    mergeMap((stops) =>
      buses.pipe(
        toArray(),
        mergeMap(async (buses) => {
          console.log(
            'calling vroom with ',
            buses.length,
            ' buses ',
            stops.length,
            ' stops'
          )
          const result = await plan({
            shipments: stops.map(stopToShipment).slice(0, 100),
            vehicles: buses.map(busToVehicle),
          })

          return result.routes.map((route, index) => ({
            bus: buses[index],
            steps: route.steps.map((step) => {
              if (step.id !== undefined) {
                step.stop = stops[step.id]
                step.id = stops[step.id].id
              }
              return step
            }),
          }))
        })
      )
    )
  )
module.exports = {
  busDispatch,
}
