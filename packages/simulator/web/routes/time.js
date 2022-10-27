const register = (experiment, socket) => {
  setInterval(() => {
    socket.emit('time', experiment.virtualTime.time())
  }, 1000)

  socket.on('reset', () => {
    experiment.virtualTime.reset()
  })

  socket.on('play', () => {
    experiment.virtualTime.play()
  })

  socket.on('pause', () => {
    experiment.virtualTime.pause()
  })

  socket.on('speed', (speed) => {
    experiment.virtualTime.setTimeMultiplier(speed)
  })
  return []
}

module.exports = {
  register,
}
