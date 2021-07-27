const engine = require('../index')
// const postombud = require("../streams/postombud");
const { fromEvent, interval, of } = require('rxjs')
const {
  window,
  map,
  toArray,
  mergeMap,
  tap,
  bufferTime,
} = require('rxjs/operators')

function register(io) {
  io.on('connection', function (socket) {
    engine.cars
      .pipe(
        mergeMap((car) => fromEvent(car, 'moved').pipe(map(() => car))),
        map(({ position: { lon, lat }, id, heading, speed, bearing }) => ({
          id,
          heading,
          speed,
          bearing,
          position: [lon, lat],
        })),
        bufferTime(500)
      )
      .subscribe((cars) => {
        socket.volatile.emit('cars', cars)
      })

    engine.postombud.pipe(toArray()).subscribe((postombud) => {
      socket.emit('postombud', postombud)
    })

    engine.bookings
      .pipe(
        map(({ address: { name, position }, id }) => ({ id, name, position })),
        bufferTime(500)
      )
      .subscribe((bookings) => {
        console.log('got bookings', bookings)
        if (bookings.length) socket.emit('bookings', bookings)
      })
  })
}

module.exports = {
  register,
}
