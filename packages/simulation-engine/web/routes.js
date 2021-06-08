const _ = require('highland')
const engine = require('../index')

function register(io) {
  io.on('connection', function (socket) {
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

    engine.postombud
      .fork()
      .filter((postombud) => postombud.kommun === 'Ljusdal')
      .batchWithTimeOrCount(1000, 2000)
      .errors(console.error)
      .each((postombud) => {
        console.log(postombud)
        socket.emit('postombud', postombud)
      })

    engine.pink
      .fork()
      // .doto((car) => (cache[car.id] = car))
      .pick(['position', 'status', 'id', 'tail', 'zone', 'speed', 'bearing'])
      .doto(
        (car) =>
          (car.position = [
            car.position.lon,
            car.position.lat,
            car.position.date,
          ])
      )
      //.filter(car => car.position.speed > 90) // endast bilar över en viss hastighet
      //.ratelimit(100, 100)
      .batchWithTimeOrCount(1000, 2000)
      .errors(console.error)
      .each((pink) => socket.volatile.emit('pink', pink))
  })
}

module.exports = {
  register,
}
