const {
  pipe,
  map,
  filter,
  tap,
  mergeMap,
  scan,
  startWith,
  combineLatest,
  throttleTime,
} = require('rxjs')

const count = () => pipe(scan((acc) => acc + 1, 0))

const register = (experiment, socket) => {
  return [
    experiment.kommuner
      .pipe(
        tap(({ id, name, geometry, co2 }) =>
          socket.emit('kommun', { id, name, geometry, co2 })
        ),
        mergeMap(({ id, dispatchedBookings, name, cars }) => {
          const totalBookings = dispatchedBookings.pipe(count(), startWith(0))

          const deliveryStatistics = dispatchedBookings.pipe(
            mergeMap((booking) => booking.deliveredEvents),
            scan(
              (
                { total, deliveryTimeTotal, totalCost },
                { deliveryTime, cost }
              ) => ({
                total: total + 1,
                totalCost: totalCost + cost,
                deliveryTimeTotal: deliveryTimeTotal + deliveryTime,
              }),
              { total: 0, totalCost: 0, deliveryTimeTotal: 0 }
            ),
            startWith({ total: 0, totalCost: 0, deliveryTimeTotal: 0 }),
            map(({ total, totalCost, deliveryTimeTotal }) => ({
              totalDelivered: total,
              totalCost,
              averageCost: totalCost / total,
              averageDeliveryTime: deliveryTimeTotal / total / 60 / 60,
            }))
          )

          const averageUtilization = cars.pipe(
            mergeMap((car) => car.cargoEvents),
            scan((acc, car) => ({ ...acc, [car.id]: car }), {}),
            map((cars) => {
              const result = {
                totalCapacity: 0,
                totalCargo: 0,
                totalCo2: 0,
                totalQueued: 0,
              }
              Object.values(cars).forEach((car) => {
                result.totalCargo += car.cargo.length
                result.totalCapacity += car.capacity
                result.totalQueued += car.queue.length
                result.totalCo2 += car.co2
              })
              return result
            }),
            map(({ totalCargo, totalCapacity, totalQueued, totalCo2 }) => ({
              totalCargo,
              totalCapacity,
              totalQueued,
              averageUtilization: totalCargo / totalCapacity,
              averageQueued: totalQueued / totalCapacity,
              totalCo2: totalCo2,
            })),
            startWith({
              totalCargo: 0,
              totalCapacity: 0,
              totalQueued: 0,
              averageUtilization: 0,
              averageQueued: 0,
              totalCo2: 0,
            })
          )

          const totalCars = cars.pipe(count(), startWith(0))

          const totalCapacity = cars.pipe(
            filter((car) => car.capacity),
            scan((a, car) => a + car.capacity, 0),
            startWith(0)
          )

          return combineLatest([
            totalBookings,
            totalCars,
            averageUtilization,
            deliveryStatistics,
            totalCapacity,
          ]).pipe(
            map(
              ([
                totalBookings,
                totalCars,
                {
                  totalCargo,
                  totalQueued,
                  totalCo2,
                  averageQueued,
                  averageUtilization,
                },
                { totalDelivered, averageDeliveryTime, averageCost, totalCost },
                totalCapacity,
              ]) => ({
                id,
                name,
                totalBookings,
                totalCars,
                totalCargo,
                totalCo2,
                totalCapacity,
                totalCost,
                averageDeliveryTime,
                totalDelivered,
                totalQueued,
                averageQueued,
                averageCost,
                averageUtilization,
              })
            ),
            // Do not emit more than 1 event per kommun per second
            throttleTime(1000)
          )
        }),
        filter(({ totalCars }) => totalCars > 0)
      )
      .subscribe((kommun) => {
        socket.emit('kommun', kommun)
      }),
  ]
}

module.exports = {
  register,
}
