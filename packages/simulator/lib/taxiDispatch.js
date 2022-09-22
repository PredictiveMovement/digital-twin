const { toArray, map, filter, mergeMap, take } = require('rxjs/operators')
const { plan } = require('./vroom')

const journeyToShipment = (id, journey) => ({
  id,
  description: journey.description,
  amount: [1],
  delivery: {
    id,
    location: [journey.destination.lon, journey.destination.lat],
    time_windows: journey.timeWindow,
  },
  pickup: {
    id,
    location: [journey.pickup.lon, journey.pickup.lat],
    time_windows: journey.timeWindow,
  },
})

const passengersToShipments = (passengers) => {
  const jobMap = {}
  let journeyIndex = 0
  const shipments = passengers.flatMap((passenger, passengerIndex) =>
    passenger.journeys.map((journey) => {
      const shipment = journeyToShipment(journeyIndex, journey)
      jobMap[journeyIndex] = { passengerIndex, journeyId: journey.id }
      journeyIndex++
      return shipment
    })
  )
  return [shipments, jobMap]
}

const taxiToVehicle = ({ id, position, capacity, heading }, i) => ({
  id: i,
  description: id,
  capacity: [capacity],
  start: [position.lon, position.lat],
  end: heading ? [heading.lon, heading.lat] : undefined,
})

const taxiDispatch = (taxis, passengers) =>
  passengers.pipe(
    toArray(),
    mergeMap((passengers) =>
      taxis.pipe(
        toArray(),
        filter((taxis) => taxis.length > 0),
        mergeMap(async (taxis) => {
          // console.log(
          //   'PLAN PLEASE',
          //   JSON.stringify(passengersToShipments(passengers), null, 2)
          // )
          const [shipments, jobMap] = passengersToShipments(passengers)
          console.log('calling vroom for taxi')
          const result = await plan({
            shipments: shipments,
            vehicles: taxis.map(taxiToVehicle),
          })
          return {
            taxis,
            routes: result.routes,
            jobMap,
          }
        }),
        // tap((res) =>
        //   console.log('vroom result: ', JSON.stringify(res, null, 2))
        // ),
        map(({ taxis, routes = [], jobMap }) => {
          return routes.map((route, index) => ({
            taxi: taxis[index],
            steps: route.steps.map((step) => {
              if (step.id !== undefined) {
                const passengerIndex = jobMap[step.id].passengerIndex
                const journeyId = jobMap[step.id].journeyId
                step.passenger = passengers[passengerIndex]
                step.id = passengers[passengerIndex].id
                step.journeyId = journeyId
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
