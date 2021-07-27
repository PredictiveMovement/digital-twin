const engine = require('../index')
// const postombud = require("../streams/postombud");
const { fromEvent, interval, of } = require('rxjs')
const { window, map, pluck, mergeMap, tap } = require('rxjs/operators')

function register(io) {
  io.on('connection', function (socket) {
    engine.cars
      .pipe(
        mergeMap(car => fromEvent(car, 'moved')),
        tap(car => console.log('got car', car)),
        map(car => ({...car, position: [car.position.lon, car.position.lat, car.position.date]})),
        window(interval(500)) // batch these updates every interval
      )
      .subscribe((cars) => socket.volatile.emit('cars', cars))

    engine.postombud
      .pipe(
        window(interval(500)) // batch these updates every interval
      )
      .subscribe((postombud) => {
        socket.emit('postombud', postombud)
      })
  })
}

module.exports = {
  register,
}
