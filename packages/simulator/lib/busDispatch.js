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

const stopToJob = (
  {
    tripId, //: '252500000000000101',
    arrivalTime, //: '17:33:49',
    departureTime, //: '17:33:49',
    position,
  },
  i
) => ({
  id: i,
  description: tripId,
  amount: [1],
  location: [position.lon, position.lat],
  time_windows: [
    [
      moment(arrivalTime, 'HH:mm:ss').valueOf(),
      moment(departureTime, 'HH:mm:ss').valueOf(),
    ],
  ],
})

const busToVehicle = ({ id, position, capacity, heading }, i) => ({
  id: i,
  description: id,
  capacity: [capacity],
  start: [position.lon, position.lat],
  end: heading ? [heading.lat, heading.lon] : undefined,
})

const busDispatch = async (buses, stops) => {
  // console.log(
  //   'PLAN PLEASE',
  //   JSON.stringify(passengers.map(passengerToShipment), null, 2)
  // )
  console.log(
    'calling vroom with ',
    buses.length,
    ' buses ',
    stops.length,
    ' stops'
  )

  const result = await plan({
    shipments: stops.map(stopToJob),
    vehicles: buses.map(busToVehicle),
  })

  return result.routes.map((route, index) => ({
    taxi: taxis[index],
    steps: route.steps.map((step) => {
      if (step.id !== undefined) {
        step.passenger = passengers[step.id]
        step.id = passengers[step.id].id
      }
      return step
    }),
  }))
}
module.exports = {
  busDispatch,
}
