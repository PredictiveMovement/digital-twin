const engine = require('../index')
// const postombud = require("../streams/postombud");
const { fromEvent, interval, of, from, merge, combineLatest } = require('rxjs')
const {
  map,
  toArray,
  mergeMap,
  mergeAll,
  tap,
  bufferTime,
  bufferCount,
  scan,
  reduce,
  filter,
  startWith,
  throttleTime,
  windowTime
} = require('rxjs/operators')

function register(io) {
  io.on('connection', function (socket) {

    socket.emit('reset')

    socket.on('reset', () => {
      process.kill(process.pid, 'SIGUSR2')
    })

    engine.cars
      .pipe(
        mergeMap((car) => fromEvent(car, 'moved')),
        //distinct(car => car.id),
        map(({ booking, position: { lon, lat }, id, heading, speed, bearing, status, fleet, cargo, capacity, queue }) => ({
          id,
          heading: [heading.lon, heading.lat], // contains route to plot or interpolate on client side.
          speed,
          bearing,
          position: [lon, lat],
          status,
          fleet,
          cargo: cargo.length + (booking ? 1 : 0),
          queue: queue.length + (booking ? 1 : 0),
          capacity
        })),
        bufferTime(100)
      )
      .subscribe((cars) => {
        if (cars.length) socket.volatile.emit('cars', cars)
      })

    engine.postombud.pipe(toArray()).subscribe((postombud) => {
      socket.emit('postombud', postombud)
    })

    engine.bookings
      .pipe(
        mergeMap(booking => merge(of(booking), fromEvent(booking, 'queued'), fromEvent(booking, 'pickedup'), fromEvent(booking, 'assigned'), fromEvent(booking, 'delivered'),)),
        map(({ destination: { position, name }, id, status, isCommercial, pickupDateTime, deliveredDateTime, car }) => ({ id, name, position, status, isCommercial, pickupDateTime, deliveredDateTime, carId: car?.id })),
        //distinct(booking => booking.id),
        bufferCount(300)
      )
      .subscribe((bookings) => {
        if (bookings.length) socket.emit('bookings', bookings)
      })


    engine.kommuner
      .pipe(
        mergeMap(
          ({ bookings, name, geometry, cars }) => {
            const totalBookings = bookings.pipe(
              scan((a) => a + 1, 0),
              startWith(0)
            )

            const averageDeliveryTime = bookings.pipe(
              mergeMap(booking => fromEvent(booking, 'delivered')),
              scan(({ total, deliveryTimeTotal }, { pickupDateTime, deliveredDateTime }) => ({
                total: total + 1,
                deliveryTimeTotal: deliveryTimeTotal + (new Date(deliveredDateTime) - new Date(pickupDateTime))
              }),
                { total: 0, deliveryTimeTotal: 0 }),
              startWith({ total: 0, deliveryTimeTotal: 0 }),
              map(({ total, deliveryTimeTotal }) => ({ totalDelivered: total, averageDeliveryTime: deliveryTimeTotal / total }))
            )

            const averageUtilization = cars.pipe(
              mergeMap(car => fromEvent(car, 'cargo')),
              bufferTime(5000),
              mergeAll(),
              reduce(({ totalCargo, totalCapacity, count, totalUtilization }, { cargo, capacity }) => ({
                count: count + 1,
                totalCargo: totalCargo + cargo.length,
                totalCapacity: totalCapacity + capacity,
                totalUtilization: totalUtilization + cargo.length / capacity
              }), { totalCargo: 0, totalCapacity: 0, count: 0, totalUtilization: 0 }),
              startWith({ totalCargo: 0, totalCapacity: 0, totalUtilization: 0, count: 0 }),
              map(({ totalCargo, totalCapacity, totalUtilization, count }) => ({ totalCargo, totalCapacity, averageUtilization: totalUtilization / count }))
            )

            averageUtilization.subscribe(a => console.log('a', a))

            const totalCars = cars.pipe(
              mergeMap(car => fromEvent(car, 'busy')),
              filter(car => car.busy),
              scan((a) => a + 1, 0),
              startWith(0)
            )

            const totalCapacity = cars.pipe(
              filter(car => car.capacity),
              scan((a, car) => a + car.capacity, 0),
              startWith(0)
            )

            return combineLatest([totalBookings, totalCars, averageUtilization, averageDeliveryTime, totalCapacity]).pipe(
              map(([totalBookings, totalCars, { totalCargo, averageUtilization }, { totalDelivered, averageDeliveryTime }, totalCapacity]) => ({
                name, geometry, totalBookings, totalCars, totalCargo, totalCapacity, averageUtilization, averageDeliveryTime, totalDelivered
              })),
              // Do not emit more than 1 event per kommun per second
              throttleTime(1000)
            )
          }),
      )
      .subscribe(data => {
        socket.emit('kommun', [data])
      })
  })
}

module.exports = {
  register,
}
