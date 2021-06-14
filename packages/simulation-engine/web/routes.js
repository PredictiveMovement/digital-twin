const _ = require('highland')
// const engine = require('../index')
const $available_cars = require('../simulator/ljusdal/pink.js')
const $bookings = require('../simulator/ljusdal/bookings.js')

const $car_positions = _()

const last_car_positions = new Map()

$available_cars
  .zip($bookings)
  .each(([car, booking]) => {

    car.on('dropoff', () => {
      console.debug('car dropoff')
      $available_cars.write(car)
    })

    car.on('moved', () => {
      console.debug('car moved')
      const obj = { id: car.id, position: car.position }
      $car_positions.write(obj)
      last_car_positions[car.id] = obj
    })

    car.handleBooking(booking)
  })

function register(io) {
  io.on('connection', function (socket) {
    console.debug('connection')
    // engine.cars
    //   .fork()
    //   // .doto((car) => (cache[car.id] = car))
    //   .pick(['position', 'status', 'id', 'tail', 'zone', 'speed', 'bearing'])
    //   .doto(
    //     (car) =>
    //       (car.position = [
    //         car.position.lon,
    //         car.position.lat,
    //         car.position.date,
    //       ])
    //   )
    //   //.filter(car => car.position.speed > 90) // endast bilar över en viss hastighet
    //   //.ratelimit(100, 100)
    //   .batchWithTimeOrCount(1000, 2000)
    //   .errors(console.error)
    //   .each((cars) => socket.volatile.emit('cars', cars))

    // engine.postombud
    //   .fork()
    //   .filter((postombud) => postombud.kommun === 'Ljusdal')
    //   .batchWithTimeOrCount(1000, 2000)
    //   .errors(console.error)
    //   .each((postombud) => {
    //     socket.emit('postombud', postombud)
    //   })

    // engine.cars
    //   .observe()
    //   // .doto((car) => (cache[car.id] = car))
    //   .pick(['position', 'status', 'id', 'tail', 'zone', 'speed', 'bearing'])
    //   .doto(
    //     (car) =>
    //     (car.position = [
    //       car.position.lon,
    //       car.position.lat,
    //       car.position.date,
    //     ])
    //   )
    //   //.filter(car => car.position.speed > 90) // endast bilar över en viss hastighet
    //   //.ratelimit(100, 100)
    //   .batchWithTimeOrCount(1000, 2000)
    //   .errors(console.error)
    //   .each((pink) => socket.volatile.emit('pink', pink))

    Object
      .values(last_car_positions)
      .forEach(pos => {
        console.debug('history')
        socket.volatile.emit('pink', [pos])
      })

    $car_positions
      .fork()
      .map(car => ({ id: car.id, position: [car.position.lon, car.position.lat, car.position.date], features: [] }))
      .errors(console.error)
      .each((pink) => {
        console.debug('pink')
        socket.volatile.emit('pink', [pink])
      })
    // $car_positions.write({
    //   position: {
    //     lat: 61.7338038,
    //     lon: 15.1681627,
    //     date: new Date(),
    //   }
    // })

  })
}

module.exports = {
  register,
}
