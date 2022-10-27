/**
 * When a new socket is connected, we send the current state of the experiment
 *
 * @param {experiment} experiment
 * @param {socket} socket
 * @returns an array of subscriptions
 */
const register = (experiment, socket) => {
  return [
    experiment.passengers.subscribe((passenger) =>
      socket.emit('passenger', passenger.toObject())
    ),
    experiment.passengerUpdates.subscribe((passenger) =>
      socket.emit('passenger', passenger.toObject())
    ),
  ]
}

module.exports = {
  register,
}
