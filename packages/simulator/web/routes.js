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
  throttleTime
} = require('rxjs/operators')

function register(io) {
  io.on('connection', function (socket) {
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
        bufferTime(100)
      )
      .subscribe((cars) => {
        socket.volatile.emit('cars', cars)
      })

    engine.postombud.pipe(toArray()).subscribe((postombud) => {
      socket.emit('postombud', postombud)
    })

    engine.bookings
      .pipe(
        mergeMap(booking => merge(of(booking), fromEvent(booking, 'moved'), fromEvent(booking, 'pickedup'), fromEvent(booking, 'assigned'), fromEvent(booking, 'delivered'), )),
        map(({ destination: { name, position }, id, status, isCommercial }) => ({ id, name, position, status, isCommercial })),
        distinct(booking => booking.id),
        bufferTime(500),
        //filter(bookings => bookings.length > 0)
      )
      .subscribe((bookings) => {
        console.log('sending bookings', bookings.length)
        socket.emit('bookings', bookings)
      })


    engine.kommuner
      .pipe(
        mergeMap(
          ({bookings, name, geometry, cars}) =>  {
            const totalBookings = bookings.pipe(
              scan((a) => a + 1, 0), 
            )

            // TODO: This is counting inactive cars
            const totalCars = cars.pipe(
              filter(car => car.busy),
              scan((a) => a + 1, 0),
            )

            const totalCapacity = cars.pipe(
              scan((acc, car) => acc + car.capacity, 0)
            )

            // TODO: Broken. Should car.cargo (or car.statistics) be a stream?
            // const utilization = cars.pipe(
            //   mergeMap(car => merge([fromEvent(car, 'pickup'),fromEvent(car, 'dropoff')])),
            //   map((car) => ({capacity: car.capacity, cargo: car.cargo.length, utilization: car.cargo.length / car.capacity})),
            //   scan((acc, car) => ({cars: acc.cars + 1, capacity: acc.capacity + car.capacity, cargo: acc.cargo + car.cargo.length}), {cars: 0, cargo: 0, capacity: 0}),
            //   map(stats => ({...stats, utilization: stats.cargo / stats.capacity}))
            //  )

            return combineLatest([totalBookings, totalCars, totalCapacity]).pipe(
              map(([totalBookings, totalCars, totalCapacity]) => ({
                name, geometry, totalBookings, totalCars, totalCapacity
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
