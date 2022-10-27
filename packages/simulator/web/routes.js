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
  ]
}

function register(io) {
  io.on('connection', function (socket) {
    if (!socket.data.experiment) {
      const experiment = engine.createExperiment({ defaultEmitters })
      experiment.subscriptions = subscribe(experiment, socket)
      socket.data.experiment = experiment
    }

    socket.emit('parameters', socket.data.experiment.parameters)
    socket.data.emitCars = defaultEmitters.includes('cars')
    socket.data.emitTaxiUpdates = defaultEmitters.includes('taxis')
    socket.data.emitBusUpdates = defaultEmitters.includes('buses')

    socket.emit('reset')
    socket.on('reset', () => {
      socket.data.experiment.subscriptions.map((e) => e.unsubscribe())
      socket.data.experiment = engine.createExperiment({ defaultEmitters })
      socket.data.experiment.subscriptions = subscribe(
        socket.data.experiment,
        socket
      )
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
  })
}
module.exports = {
  register,
}
