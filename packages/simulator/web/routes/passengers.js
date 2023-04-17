const { bufferTime, filter, merge } = require('rxjs')

/**
 * When a new socket is connected, we send the current state of the experiment
 *
 * @param {experiment} experiment
 * @param {socket} socket
 * @returns an array of subscriptions
 */
const register = (experiment, socket) => {
  return [
    merge(experiment.passengers, experiment.passengerUpdates)
      .pipe(
        bufferTime(500), // start a window every x ms
        filter((p) => p.length > 0)
      )
      .subscribe((passengers) => {
        const passengerObjects = passengers.map((p) => p.toObject())
        socket.emit('passengers', passengerObjects)
      }),
  ]
}

module.exports = {
  register,
}
