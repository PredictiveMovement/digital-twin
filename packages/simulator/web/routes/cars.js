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
  position: { lon, lat },
  id,
  altitude,
  destination,
  speed,
  bearing,
  status,
  fleet,
  cargo,
  parcelCapacity,
  queue,
  co2,
  distance,
  ema,
  eta,
  vehicleType,
}) => ({
  id,
  destination: (destination && [destination.lon, destination.lat]) || null,
  speed,
  bearing,
  position: [lon, lat, altitude || 0],
  status,
  fleet: fleet?.name || 'Privat',
  co2,
  distance,
  ema,
  eta,
  cargo: cargo.length,
  queue: queue.length,
  parcelCapacity,
  vehicleType,
})

const register = (experiment, socket) => {
  return [
    experiment.cars.pipe(map(cleanCars)).subscribe((car) => {
      socket.emit('cars', [car])
    }),
    experiment.carUpdates
      .pipe(
        windowTime(100),
        mergeMap((win) =>
          win.pipe(
            groupBy((car) => car.id),
            mergeMap((cars) => cars.pipe(last()))
          )
        ),
        filter((car) => {
          if (!car) return false
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
        socket.volatile.emit('cars', cars)
      }),
  ]
}

module.exports = {
  register,
}
