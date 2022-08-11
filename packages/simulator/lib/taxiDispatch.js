const { toArray, map, filter, mergeMap, take } = require('rxjs/operators')
const { plan } = require('./vroom')

const journeyToShipment = (id, journey, passengerIdx) => ({
  id,
  description: passengerIdx,
  amount: [1],
  delivery: {
    id,
    location: [journey.destination.lon, journey.destination.lat],
  },
  pickup: {
    id,
    location: [journey.pickup.lon, journey.pickup.lat],
  },
  time_windows: journey.timeWindow,
})

const passengersToShipments = (passengers) => {
  console.log("passengersToShipments")
  let idCounter = 0
  return passengers.flatMap((passenger, passengerIdx) =>
    passenger.journeys.map((journey) =>
      journeyToShipment(idCounter++, journey, passengerIdx)
    )
  )
}

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
          //   JSON.stringify(passengersToShipments(passengers), null, 2)
          // )
          console.log('calling vroom')
          const result = await plan({
            shipments: passengersToShipments(passengers),
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
                step.passenger = passengers[step.description]
                step.id = passengers[step.description].id
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
