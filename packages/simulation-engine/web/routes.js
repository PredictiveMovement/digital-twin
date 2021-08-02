const engine = require('../index')
// const postombud = require("../streams/postombud");
const { fromEvent, interval, of, from } = require('rxjs')
const {
  window,
  map,
  toArray,
  mergeMap,
  tap,
  bufferTime,
  scan,
  reduce,
  concatMap,
  throttleTime
} = require('rxjs/operators')

function register(io) {
  io.on('connection', function (socket) {
    engine.cars
      .pipe(
        mergeMap((car) => fromEvent(car, 'moved').pipe(map(() => car))),
        map(({ position: { lon, lat }, id, heading, speed, bearing }) => ({
          id,
          // heading, // contains route to plot or interpolate on client side.
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
        map(({ destination: { name, position }, id }) => ({ id, name, position })),
        bufferTime(500)
      )
      .subscribe((bookings) => {
        if (bookings.length) socket.emit('bookings', bookings)
      })


    engine.kommuner
      .pipe(
        mergeMap(
          ({bookings, name, geometry}) =>  {
            return bookings.pipe(
              scan((a) => a + 1, 0), 
              map(totalBookings => ({
                name, geometry, totalBookings
              })),
              // Max 1 per second per kommun
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
