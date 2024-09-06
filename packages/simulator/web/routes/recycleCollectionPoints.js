const { toArray } = require('rxjs')

const register = (experiment, socket) => {
  return [
    experiment.recycleCollectionPoints
      .pipe(toArray())
      .subscribe((recyclePoints) => {
        socket.emit('recycleCollectionPoints', recyclePoints)
      }),
  ]
}

module.exports = {
  register,
}
