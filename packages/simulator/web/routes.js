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
  windowTime
} = require('rxjs/operators')

const { virtualTime } = require('../lib/virtualTime')

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

    engine.kommuner.pipe(
      map(({id, name, geometry}) => ({id, name, geometry}))
    ).subscribe((kommun) => 
      socket.emit('kommun', kommun)
    )
  })
    
  engine.carUpdates
    .pipe(
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
      if (cars.length) io.emit('cars', cars)
    })

  engine.bookingUpdates
    .pipe(
      map(({ 
        pickup: { position: pickup }, 
        destination: { position: destination, name }, 
        id, status, isCommercial, 
        deliveryTime, car 
      }) => ({ 
        id, pickup, destination,
        name, status, isCommercial, 
        deliveryTime, 
        carId: car?.id 
      })),
      //distinct(booking => booking.id),
      bufferCount(30)
    )
    .subscribe((bookings) => {
      if (bookings.length) io.emit('bookings', bookings)
    })


  engine.kommuner
    .pipe(
      mergeMap(
        ({ id, bookings, name, cars }) => {
          const totalBookings = bookings.pipe(
            scan((a) => a + 1, 0),
            startWith(0)
          )

          const averageDeliveryTime = bookings.pipe(
            mergeMap(booking => fromEvent(booking, 'delivered')),
            scan(({ total, deliveryTimeTotal }, { deliveryTime }) => ({
              total: total + 1,
              deliveryTimeTotal: deliveryTimeTotal + deliveryTime
            }),
              { total: 0, deliveryTimeTotal: 0 }),
            startWith({ total: 0, deliveryTimeTotal: 0 }),
            map(({ total, deliveryTimeTotal }) => ({ totalDelivered: total, averageDeliveryTime: (deliveryTimeTotal / total) / 60 / 60 }))
          )

          const averageUtilization = cars.pipe(
            mergeMap(car => fromEvent(car, 'cargo')),
            scan((acc, car) => {acc[car.id] = car; return acc}, {}),
            map((cars) => {
              const result = {
                totalCapacity: 0,
                totalCargo: 0,
                totalQueued: 0,
              }
              Object.values(cars).forEach(car => {
                result.totalCargo += car.cargo.length
                result.totalCapacity += car.capacity
                result.totalQueued += car.queue.length
              })
              return result
            }),
            map(({ totalCargo, totalCapacity, totalQueued }) => ({ 
              totalCargo, totalCapacity, totalQueued, 
              averageUtilization: totalCargo / totalCapacity, 
              averageQueued: totalQueued / totalCapacity 
            })),
            startWith({ totalCargo: 0, totalCapacity: 0, totalQueued: 0, averageUtilization: 0, averageQueued: 0}),
          )

          const totalCars = cars.pipe(
            scan((a) => a + 1, 0),
          )

          const totalCapacity = cars.pipe(
            filter(car => car.capacity),
            scan((a, car) => a + car.capacity, 0),
          )

          return combineLatest([totalBookings, totalCars, averageUtilization, averageDeliveryTime, totalCapacity]).pipe(
            map(([totalBookings, totalCars, { totalCargo, averageUtilization, totalQueued, averageQueued }, { totalDelivered, averageDeliveryTime }, totalCapacity]) => ({
              id, name, totalBookings, totalCars, totalCargo, totalCapacity, averageUtilization, averageDeliveryTime, totalDelivered, totalQueued, averageQueued
            })),
            // Do not emit more than 1 event per kommun per second
            throttleTime(5000)
          )
        }),
    )
    .subscribe(kommun => {
      io.sockets.emit('kommun', kommun)
    })
}

module.exports = {
  register,
}
