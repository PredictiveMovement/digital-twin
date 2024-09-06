const { toArray } = require('rxjs')

const registerRecycleCollection = (experiment, socket) => {
  return [
    experiment.recycleCollectionPoints
      .pipe(toArray())
      .subscribe((recyclePoints) => {
        socket.emit('recycleCollectionPoints', recyclePoints)
      }),
  ]
}

module.exports = {
  registerRecycleCollection,
}
