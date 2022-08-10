const { toArray, map, filter, mergeMap, take } = require('rxjs/operators')
const { plan } = require('./vroom')

const passengerToShipment = (
  { id, destination, pickup, position, arrivalTime, departureTime },
  i
) => ({
  id: i,
  description: id,
  amount: [1],
  delivery: {
    id: i,
    location: [destination.lon, destination.lat],
  },
  pickup: {
    id: i,
    location: [pickup.lon, pickup.lat],
  },
})

const taxiToVehicle = ({ id, position, capacity, heading }, i) => ({
  id: i,
  description: id,
  capacity: [capacity],
  start: [position.lon, position.lat],
  end: heading ? [heading.lat, heading.lon] : undefined,
})

const taxiDispatch = (taxis, passengers) =>
  passengers.pipe(
    mergeMap((passengers) =>
      taxis.pipe(
        take(200),
        toArray(),
        filter((taxis) => taxis.length > 0),
        mergeMap(async (taxis) => {
          // console.log(
          //   'PLAN PLEASE',
          //   JSON.stringify(passengers.map(passengerToShipment), null, 2)
          // )
          console.log(
            'calling vroom with ',
            taxis.length,
            ' cars ',
            passengers.length,
            'passengers'
          )
          const result = await plan({
            shipments: passengers.map(passengerToShipment),
            vehicles: taxis.map(taxiToVehicle),
          })
          return {
            taxis,
            routes: result.routes,
          }
        }),
        // tap((res) =>
        //   console.log('vroom result: ', JSON.stringify(res, null, 2))
        // ),
        map(({ taxis, routes = [] }) => {
          return routes.map((route, index) => ({
            taxi: taxis[index],
            steps: route.steps.map((step) => {
              if (step.id !== undefined) {
                step.passenger = passengers[step.id]
                step.id = passengers[step.id].id
              }
              return step
            }),
          }))
        })
      )
    )
  )

module.exports = {
  taxiDispatch,
}
