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
  distinct,
  filter,
  startWith,
  throttleTime,
  windowTime,
  first,
  groupBy,
  last,
} = require('rxjs/operators')

const { virtualTime } = require('../lib/virtualTime')

const cleanBookings = () => (bookings) =>
  bookings.pipe(
    map(
      ({
        pickup: { position: pickup },
        destination: { position: destination, name },
        id,
        status,
        isCommercial,
        co2,
        cost,
        deliveryTime,
        car,
      }) => ({
        id,
        pickup,
        destination,
        name,
        status,
        isCommercial,
        deliveryTime,
        co2,
        cost,
        carId: car?.id,
      })
    )
  )

function register(io) {
  io.on('connection', function (socket) {
    socket.emit('reset')

    socket.on('reset', () => {
      process.kill(process.pid, 'SIGUSR2')
    })

    socket.on('play', () => {
      virtualTime.play()
    })

    socket.on('pause', () => {
      virtualTime.pause()
    })

    socket.on('speed', (speed) => {
      virtualTime.setTimeMultiplier(speed)
    })

    engine.postombud.pipe(toArray()).subscribe((postombud) => {
      socket.emit('postombud', postombud)
    })
    engine.busStops.subscribe((busStops) => socket.emit('busStops', busStops))

    engine.kommuner
      .pipe(map(({ id, name, geometry }) => ({ id, name, geometry })))
      .subscribe((kommun) => socket.emit('kommun', kommun))

    engine.dispatchedBookings
      .pipe(bufferTime(100, null, 1000))
      .subscribe((bookings) => {
        if (bookings.length) {
          socket.emit('bookings', bookings)
        }
      })
  })

  engine.bookingUpdates
    .pipe(cleanBookings(), bufferTime(100, null, 1000))
    .subscribe((bookings) => {
      if (bookings.length) {
        io.emit('bookings', bookings)
      }
    })
  engine.carUpdates
    .pipe(
      windowTime(100), // start a window every x ms
      mergeMap((win) =>
        win.pipe(
          groupBy((car) => car.id), // create a stream for each car in this window
          mergeMap((cars) => cars.pipe(last())) // take the last update in this window
        )
      ),
      map(
        ({
          booking,
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
        }) => ({
          id,
          heading: [heading.lon, heading.lat], // contains route to plot or interpolate on client side.
          speed,
          bearing,
          position: [lon, lat, altitude || 0],
          status,
          fleet: fleet?.name || 'Privat',
          co2,
          cargo: cargo.length + (booking ? 1 : 0),
          queue: queue.length + (booking ? 1 : 0),
          capacity,
        })
      ),
      bufferCount(10)
    )
    .subscribe((cars) => {
      if (cars.length) io.emit('cars', cars)
    })

  setInterval(() => {
    io.emit('time', virtualTime.time())
  }, 1000)

  engine.kommuner
    .pipe(
      mergeMap(({ id, dispatchedBookings, name, cars }) => {
        const totalBookings = dispatchedBookings.pipe(
          scan((a) => a + 1, 0),
          startWith(0)
        )

        const averageDeliveryTime = dispatchedBookings.pipe(
          mergeMap((booking) => fromEvent(booking, 'delivered')),
          scan(
            ({ total, deliveryTimeTotal }, { deliveryTime }) => ({
              total: total + 1,
              deliveryTimeTotal: deliveryTimeTotal + deliveryTime,
            }),
            { total: 0, deliveryTimeTotal: 0 }
          ),
          startWith({ total: 0, deliveryTimeTotal: 0 }),
          map(({ total, deliveryTimeTotal }) => ({
            totalDelivered: total,
            averageDeliveryTime: deliveryTimeTotal / total / 60 / 60,
          }))
        )

        const averageUtilization = cars.pipe(
          mergeMap((car) => fromEvent(car, 'cargo')),
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
            totalCo2,
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

        const totalCars = cars.pipe(
          scan((a) => a + 1, 0),
          startWith(0)
        )

        const totalCapacity = cars.pipe(
          filter((car) => car.capacity),
          scan((a, car) => a + car.capacity, 0),
          startWith(0)
        )

        return combineLatest([
          totalBookings,
          totalCars,
          averageUtilization,
          averageDeliveryTime,
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
              { totalDelivered, averageDeliveryTime },
              totalCapacity,
            ]) => ({
              id,
              name,
              totalBookings,
              totalCars,
              totalCargo,
              totalCo2,
              totalCapacity,
              averageDeliveryTime,
              totalDelivered,
              totalQueued,
              averageQueued,
              averageUtilization,
            })
          ),
          // Do not emit more than 1 event per kommun per second
          throttleTime(1000)
        )

        // return combineLatest([totalBookings, totalCars, averageUtilization, averageDeliveryTime, totalCapacity]).pipe(
        //   map(([totalBookings, totalCars, { totalCargo, averageUtilization, totalQueued, averageQueued }, { totalDelivered, averageDeliveryTime }, totalCapacity]) => ({
        //     id, name, totalBookings, totalCars, totalCargo, totalCapacity, averageUtilization, averageDeliveryTime, totalDelivered, totalQueued, averageQueued
        //   })),
        //   // Do not emit more than 1 event per kommun per second
        //   throttleTime(5000)
        // )
      }),
      filter(({ totalCars }) => totalCars > 0)
    )
    .subscribe((kommun) => {
      io.emit('kommun', kommun)
    })
}

module.exports = {
  register,
}
