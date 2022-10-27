const { toArray } = require('rxjs')

const register = (experiment, socket) => {
  return [
    experiment.postombud.pipe(toArray()).subscribe((postombud) => {
      socket.emit('postombud', postombud)
    }),
  ]
}

module.exports = {
  register,
}
