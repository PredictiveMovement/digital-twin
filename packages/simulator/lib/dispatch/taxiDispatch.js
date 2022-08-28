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

const passengersToShipments = (passengers) =>
  from(passengers).pipe(
    mergeMap((passenger, i) =>
      passenger.journeys.pipe(map((journey) => journeyToShipment(i, journey)))
    ),
    toArray()
  )

const taxiToVehicle = ({ id, position, capacity, heading }, i) => ({
  id: i,
  description: id,
  capacity: [capacity],
  start: [position.lon, position.lat],
  end: heading ? [heading.lon, heading.lat] : undefined,
})

const taxiDispatch = (taxis, passengers) =>
  taxis.pipe(
    toArray(),
    filter((taxis) => taxis.length > 0),
    mergeMap(taxis => passengers.pipe(
      mergeMap(passenger => passenger.journeys),
      map((journeys) => ({ taxis, passengers })),
    )),
    mergeMap(async ({ taxis, passengers }) => {
      console.log('calling vroom for taxi', vehicles, shipments)
      const result = await plan({ shipments, vehicles: taxis.map(taxiToVehicle) })
      return {
        vehicles,
        routes: result.routes,
      }
    }),
      
      map(({ taxis, routes = [] }) => routes.map((route, index) => ({
          taxi: taxis[index],
          journeys: shipments.steps.map((step) => {
            if (step.id !== undefined) {
              step.passenger = passengers[passengerIndex]
              step.id = passengers[passengerIndex].id
              step.journeyId = journeyId
            }
            return step
          }),
      }))


module.exports = {
  taxiDispatch,
}
