const { throttleTime } = require('rxjs')

const register = (experiment, socket) => {
  const virtualTime = experiment.virtualTime

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
  return [
    virtualTime
      .getTimeStream()
      .pipe(
        throttleTime(1000) // throttleTime 1000ms is used to not use the same update interval as the clock (100 ms)
      )
      .subscribe((time) => socket.emit('time', time)),
  ]
}

module.exports = {
  register,
}
