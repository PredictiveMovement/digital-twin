const {
  map,
  bufferTime,
  filter,
  last,
  mergeMap,
  groupBy,
  windowTime,
} = require('rxjs')

const cleanCars = ({
  // TODO: Replace cleanCars with .toObject() on Vehicle
  position: { lon, lat },
  id,
  altitude,
  heading,
  speed,
  bearing,
  status,
  fleet,
  cargo,
  capacity,
  queue,
  co2,
  distance,
  lineNumber,
  vehicleType,
}) => ({
  id,
  heading: (heading && [heading.lon, heading.lat]) || null, // contains route to plot or interpolate on client side.
  speed,
  bearing,
  position: [lon, lat, altitude || 0],
  status,
  fleet: fleet?.name || 'Privat',
  co2,
  distance,
  cargo: cargo.length,
  queue: queue.length,
  capacity,
  lineNumber,
  vehicleType,
})

const register = (experiment, socket) => {
  return [
    experiment.cars.pipe(map(cleanCars)).subscribe((car) => {
      socket.emit('cars', [car])
    }),
    experiment.carUpdates
      .pipe(
        windowTime(100), // start a window every x ms
        mergeMap((win) =>
          win.pipe(
            groupBy((car) => car.id), // create a stream for each car in this window
            mergeMap((cars) => cars.pipe(last())) // take the last update in this window
          )
        ),
        filter((car) => {
          if (!car) return false
          if (car.vehicleType === 'bus' && !socket.data.emitBusUpdates)
            return false
          if (car.vehicleType === 'taxi' && !socket.data.emitTaxiUpdates)
            return false
          if (car.vehicleType === 'car' && !socket.data.emitCars) return false
          return true
        }),
        map(cleanCars),
        map((vehicle) => ({
          experimentId: experiment.parameters.id,
          ...vehicle,
        })),
        bufferTime(100, null, 100)
      )
      .subscribe((cars) => {
        if (!cars.length) return
        socket.emit('cars', cars)
      }),
    experiment.buses
      .pipe(
        map(cleanCars),
        map((vehicle) => ({
          experimentId: experiment.parameters.id,
          ...vehicle,
        }))
      )
      .subscribe((car) => {
        socket.emit('cars', [car])
      }),
    experiment.taxis.subscribe(({ id, position: { lon, lat } }) => {
      socket.emit('taxi', { id, position: [lon, lat] })
    }),
  ]
}

module.exports = {
  register,
}
