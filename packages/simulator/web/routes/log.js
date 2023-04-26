const register = (experiment, socket) => {
  return [experiment.logStream.subscribe((item) => socket.emit('log', item))]
}

module.exports = {
  register,
}
