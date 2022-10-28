const engine = require('../index')
const { saveParameters } = require('../lib/fileUtils')
const { info } = require('../lib/log')
const { defaultEmitters } = require('../config')

function subscribe(experiment, socket) {
  return [
    require('./routes/bookings').register(experiment, socket),
    require('./routes/buses').register(experiment, socket),
    require('./routes/cars').register(experiment, socket),
    require('./routes/kommuner').register(experiment, socket),
    require('./routes/measureStations').register(experiment, socket),
    require('./routes/passengers').register(experiment, socket),
    require('./routes/postombud').register(experiment, socket),
    require('./routes/time').register(experiment, socket),
  ].flat()
}

function start(socket) {
  const experiment = engine.createExperiment({ defaultEmitters })
  experiment.subscriptions = subscribe(experiment, socket)
  socket.data.experiment = experiment
}

function register(io) {
  io.on('connection', function (socket) {
    if (!socket.data.experiment) {
      start(socket)
    }

    socket.emit('parameters', socket.data.experiment.parameters)
    socket.data.emitCars = defaultEmitters.includes('cars')
    socket.data.emitTaxiUpdates = defaultEmitters.includes('taxis')
    socket.data.emitBusUpdates = defaultEmitters.includes('buses')

    socket.emit('reset')
    socket.on('reset', () => {
      socket.data.experiment.subscriptions.map((e) => e.unsubscribe())
      start(socket)
    })

    socket.on('carLayer', (val) => (socket.data.emitCars = val))
    socket.on('taxiUpdatesToggle', (val) => (socket.data.emitTaxiUpdates = val))
    socket.on('busUpdatesToggle', (val) => (socket.data.emitBusUpdates = val))
    socket.on('experimentParameters', (value) => {
      info('New expiriment settings: ', value)
      saveParameters(value)
      socket.emit('reset')
    })

    socket.emit('parameters', socket.data.experiment.parameters)

    socket.on('disconnect', (reason) => {
      info('Client disconnected', reason)
      socket.data.experiment.subscriptions.map((e) => e.unsubscribe())
    })
  })
}
module.exports = {
  register,
}
