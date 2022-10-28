const { toArray } = require('rxjs')

const register = (experiment, socket) => {
  return [
    experiment.busStops
      .pipe(toArray())
      .subscribe((busStops) => socket.emit('busStops', busStops)),

    experiment.lineShapes
      .pipe(toArray())
      .subscribe((lineShapes) => socket.emit('lineShapes', lineShapes)),
  ]
}

module.exports = {
  register,
}
