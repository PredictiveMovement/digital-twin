const { toArray } = require('rxjs')

const register = (experiment, socket) => {
  return [
    experiment.recycleCollectionPoints
      .pipe(toArray())
      .subscribe((recycleCollectionPoints) => {
        console.log(
          '📤 Emitting recycleCollectionPoints:',
          recycleCollectionPoints
        )

        socket.emit('recycleCollectionPoints', recycleCollectionPoints)
      }),
  ]
}

module.exports = {
  register,
}
