const _ = require('highland')
const moment = require('moment')
const engine = require('@iteam1337/engine')

const cache = {}

function register (io) {
  io.on('connection', function (socket) {
    console.log('connection', cache)
    _.merge([_.values(cache), engine.cars.fork()])
      .doto(car => (cache[car.id] = car))
      .pick(['position', 'status', 'id', 'tail', 'zone', 'speed', 'bearing'])
      .doto(
        car =>
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
      .each(cars => socket.volatile.emit('cars', cars))
  })
}

module.exports = {
  register,
}
