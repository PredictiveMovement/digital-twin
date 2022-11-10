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
          const passengerDeliveryStatistics = dispatchedBookings.pipe(
            mergeMap((booking) => booking.deliveredEvents),
            filter((booking) => booking.type === 'passenger'),
            filter((b) => b.cost),
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
            map(({ type, total, totalCost, deliveryTimeTotal }) => ({
              totalDelivered: total,
              totalCost,
              averagePassengerCost: totalCost / total,
              averagePassengerDeliveryTime: deliveryTimeTotal / total / 60 / 60,
            }))
          )

          const parcelDeliveryStatistics = dispatchedBookings.pipe(
            mergeMap((booking) => booking.deliveredEvents),
            filter((booking) => booking.type !== 'passenger'),
            filter((b) => b.cost),
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
            map(({ type, total, totalCost, deliveryTimeTotal }) => ({
              totalDelivered: total,
              totalCost,
              averageParcelCost: totalCost / total,
              averageParcelDeliveryTime: deliveryTimeTotal / total / 60 / 60,
            }))
          )

          const averageUtilization = cars.pipe(
            mergeMap((car) => car.cargoEvents),
            scan((acc, car) => ({ ...acc, [car.id]: car }), {}),
            map((cars) =>
              Object.values(cars).reduce(
                (acc, car) => ({
                  totalCargo: acc.totalCargo + car.cargo.length,
                  totalParcelCapacity:
                    acc.totalParcelCapacity + (car.parcelCapacity || 0),
                  totalPassengerCapacity:
                    acc.totalPassengerCapacity + (car.PassengerCapacity || 0),
                  totalCo2: (acc.totalCo2 += car.co2),
                }),
                {
                  totalCargo: 0,
                  totalParcelCapacity: 0,
                  totalPassengerCapacity: 0,
                  totalCo2: 0,
                }
              )
            ),
            map(
              ({
                totalCargo,
                totalParcelCapacity,
                totalPassengerCapacity,
                totalCo2,
              }) => ({
                totalCargo,
                totalParcelCapacity,
                totalPassengerCapacity,
                averagePassengerLoad: totalCargo / totalPassengerCapacity,
                averageParcelLoad: totalCargo / totalParcelCapacity,
                totalCo2: totalCo2,
              })
            ),
            startWith({
              totalCargo: 0,
              totalParcelCapacity: 0,
              totalPassengerCapacity: 0,
              averageParcelLoad: 0,
              averagePassengerLoad: 0,
              totalCo2: 0,
            })
          )

          const totalCars = cars.pipe(count(), startWith(0))

          const totalPassengerCapacity = cars.pipe(
            filter((car) => car.passengerCapacity),
            scan((a, car) => a + car.passengerCapacity, 0),
            startWith(0)
          )

          const totalParcelCapacity = cars.pipe(
            filter((car) => car.parcelCapacity),
            scan((a, car) => a + car.parcelCapacity, 0),
            startWith(0)
          )

          return combineLatest([
            totalCars,
            averageUtilization,
            passengerDeliveryStatistics,
            parcelDeliveryStatistics,
            totalPassengerCapacity,
            totalParcelCapacity,
          ]).pipe(
            map(
              ([
                totalCars,
                {
                  totalCargo,
                  totalCo2,
                  averagePassengerLoad,
                  averageParcelLoad,
                },
                { averagePassengerDeliveryTime, averagePassengerCost },
                { averageParcelDeliveryTime, averageParcelCost },
                totalPassengerCapacity,
                totalParcelCapacity,
              ]) => ({
                id,
                name,
                totalCars,
                totalCargo,
                totalCo2,
                totalPassengerCapacity,
                totalParcelCapacity,
                averagePassengerDeliveryTime,
                averagePassengerCost,
                averagePassengerLoad,
                averageParcelLoad,
                averageParcelDeliveryTime,
                averageParcelCost,
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
