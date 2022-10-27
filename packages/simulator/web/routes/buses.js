const register = (experiment, socket) => {
  return [
    experiment.busStops.subscribe((busStops) =>
      socket.emit('busStops', busStops)
    ),
    experiment.lineShapes.subscribe((lineShapes) =>
      socket.emit('lineShapes', lineShapes)
    ),
  ]
}

module.exports = {
  register,
}
