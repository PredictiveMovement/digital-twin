const { mergeAll, timer, of } = require('rxjs')
const {
  toArray,
  map,
  tap,
  filter,
  takeUntil,
  delay,
  mergeMap,
  catchError,
  groupBy,
  take,
} = require('rxjs/operators')
const { plan } = require('./vroom')
const moment = require('moment')

const passengerToShipment = (
  { id, destination, pickup, position, arrivalTime, departureTime },
  i
) => ({
  id: i,
  description: id,
  amount: [1],
  delivery: {
    id: i,
    location: [destination.lat, destination.lon],
  },
  pickup: {
    id: i,
    location: [pickup.lat, pickup.lon],
  },
})

const taxiToVehicle = ({ id, position, capacity, heading }, i) => ({
  id: i,
  description: id,
  capacity: [capacity],
  start: [position.lat, position.lon],
  end: heading ? [heading.lat, heading.lon] : undefined,
})

const taxiDispatch = (taxis, passengers) =>
  passengers.pipe(
    //tap((stop) => console.log('stop', stop)),
    toArray(),
    mergeMap((passengers) =>
      taxis.pipe(
        //tap((taxi) => console.log('taxi', taxi)),
        takeUntil(timer(5000)), // to be able to sort we have to batch somehow. Lets start with time
        toArray(),
        filter((taxis) => taxis.length > 0),
        // tap((taxis) =>
        //   console.log('taxi dispatch', passengers.length, taxis.length)
        // ),
        mergeMap(async (taxis) => {
          // console.log(
          //   'PLAN PLEASE',
          //   JSON.stringify(passengers.map(passengerToShipment), null, 2)
          // )
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
