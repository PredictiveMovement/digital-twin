const { toArray } = require('rxjs')

const register = (experiment, socket) => {
  return [
    experiment.garbageCollectionPoints
      .pipe(toArray())
      .subscribe((garbagePoints) => {
        socket.emit('garbageCollectionPoints', garbagePoints)
      }),

    //experiment.garbageCollectionUpdates.subscribe((update) => {
    //  socket.emit('garbageCollectionUpdate', update)
    //}),
  ]
}

module.exports = {
  register,
}
