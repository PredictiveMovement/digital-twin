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
      moment(arrivalTime, 'HH:mm:ss').valueOf() / 1000,
      moment(departureTime, 'HH:mm:ss').valueOf() / 1000 + 1,
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
            jobs: stops.map(stopToJob).slice(0, 100),
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
