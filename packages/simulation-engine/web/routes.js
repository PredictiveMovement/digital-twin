const engine = require('../index')
// const postombud = require("../streams/postombud");
const { fromEvent, interval, of } = require('rxjs')
const { window, map, toArray, mergeMap, tap, bufferTime } = require('rxjs/operators')

function register(io) {
  io.on('connection', function (socket) {
    engine.cars
      .pipe(
        mergeMap((car) => fromEvent(car, 'moved').pipe(map(() => car))),
        map(({ position: { lon, lat }, id, tail, speed, bearing }) => ({
          id,
          tail,
          speed,
          bearing,
          position: [lon, lat],
        })),
        tap((car) => console.log('got car', car)),
        bufferTime(500)
      )
      .subscribe((cars) => {
        console.log('cars', cars)
        socket.volatile.emit('cars', cars)
      })

    engine.postombud.pipe(toArray()).subscribe((postombud) => {
      socket.emit('postombud', postombud)
    })
  })
}

module.exports = {
  register,
}
