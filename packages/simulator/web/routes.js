const engine = require('../index')
// const postombud = require("../streams/postombud");
const { fromEvent, interval, of, from, merge, combineLatest } = require('rxjs')
const {
  window,
  map,
  toArray,
  mergeMap,
  tap,
  bufferTime,
  scan,
  distinct,
  filter,
  reduce,
  concatMap,
  startWith,
  throttleTime
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
        map(({ position: { lon, lat }, id, heading, speed, bearing, status }) => ({
          id,
          heading: [heading.lon, heading.lat], // contains route to plot or interpolate on client side.
          speed,
          bearing,
          position: [lon, lat],
          status
        })),
      )
      .subscribe((car) => {
        socket.volatile.emit('cars', [car])
      })

    engine.postombud.pipe(toArray()).subscribe((postombud) => {
      socket.emit('postombud', postombud)
    })

    engine.bookings
      .pipe(
        mergeMap(booking => merge(of(booking), fromEvent(booking, 'pickedup'), fromEvent(booking, 'assigned'), fromEvent(booking, 'delivered'),)),
        map(({ destination: { position, name }, id, status, isCommercial }) => ({ id, name, position, status, isCommercial })),
        //distinct(booking => booking.id),
      )
      .subscribe((booking) => {
        socket.emit('bookings', [booking])
      })


    engine.kommuner
      .pipe(
        mergeMap(
          ({ bookings, name, geometry, cars }) => {
            const totalBookings = bookings.pipe(
              scan((a) => a + 1, 0),
              startWith(0)
            )

            // TODO: This is counting inactive cars
            const totalCars = cars.pipe(
              mergeMap(car => fromEvent(car, 'busy')),
              filter(car => car.busy),
              scan((a) => a + 1, 0),
              startWith(0)
            )

            const totalCapacity = cars.pipe(
              mergeMap(car => fromEvent(car, 'busy')),
              scan((acc, car) => acc + car.capacity, 0),
              startWith(0)
            )

            const totalCargo = cars.pipe(
              mergeMap(car => fromEvent(car, 'cargo')),
              filter(car => car.busy),
              scan((acc, car) => acc + car.cargo.length, 0),
              startWith(0)
            )

            // TODO: Broken. Should car.cargo (or car.statistics) be a stream?
            // const utilization = cars.pipe(
            //   mergeMap(car => merge([fromEvent(car, 'pickup'),fromEvent(car, 'dropoff')])),
            //   map((car) => ({capacity: car.capacity, cargo: car.cargo.length, utilization: car.cargo.length / car.capacity})),
            //   scan((acc, car) => ({cars: acc.cars + 1, capacity: acc.capacity + car.capacity, cargo: acc.cargo + car.cargo.length}), {cars: 0, cargo: 0, capacity: 0}),
            //   map(stats => ({...stats, utilization: stats.cargo / stats.capacity}))
            //  )

            return combineLatest([totalBookings, totalCars, totalCapacity, totalCargo]).pipe(
              map(([totalBookings, totalCars, totalCapacity, totalCargo]) => ({
                name, geometry, totalBookings, totalCars, totalCapacity, totalUtilization: totalCargo / totalCapacity
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
