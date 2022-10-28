const { toArray } = require('rxjs')

const register = (experiment, socket) => {
  return [
    experiment.measureStations.pipe(toArray()).subscribe((measureStations) => {
      socket.emit('measureStations', measureStations)
    }),
  ]
}

module.exports = {
  register,
}
