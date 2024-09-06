const { toArray } = require('rxjs')

const register = (experiment, socket) => {
  console.log(
    ' :::::::::::::::::::::::::::::::::::::::: Registering garbageCollectionPoints :::::::::::::::::::::::::::::::::::::::: '
  )
  return [
    experiment.garbageCollectionPoints
      .pipe(toArray())
      .subscribe((garbageCollectionPoints) => {
        console.log(
          '📤 Emitting garbageCollectionPoints:',
          garbageCollectionPoints
        )
        socket.emit('garbageCollectionPoints', garbageCollectionPoints)
      }),

    //experiment.garbageCollectionUpdates.subscribe((update) => {
    //  socket.emit('garbageCollectionUpdate', update)
    //}),
  ]
}

module.exports = {
  register,
}
