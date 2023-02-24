const engine = require('../index')
const { saveParameters } = require('../lib/fileUtils')
const { info } = require('../lib/log')
const { defaultEmitters, ignoreWelcomeMessage } = require('../config')
const cookie = require('cookie')

function subscribe(experiment, socket) {
  return [
    defaultEmitters.includes('bookings') &&
      require('./routes/bookings').register(experiment, socket),
    defaultEmitters.includes('buses') &&
      require('./routes/buses').register(experiment, socket),
    defaultEmitters.includes('cars') &&
      require('./routes/cars').register(experiment, socket),
    defaultEmitters.includes('kommuner') &&
      require('./routes/kommuner').register(experiment, socket),
    defaultEmitters.includes('measureStations') &&
      require('./routes/measureStations').register(experiment, socket),
    defaultEmitters.includes('passengers') &&
      require('./routes/passengers').register(experiment, socket),
    defaultEmitters.includes('postombud') &&
      require('./routes/postombud').register(experiment, socket),
    require('./routes/time').register(experiment, socket),
  ]
    .filter((f) => f)
    .flat()
}

function start(socket) {
  const experiment = engine.createExperiment({ defaultEmitters })
  experiment.subscriptions = subscribe(experiment, socket)
  socket.data.experiment = experiment
}

function register(io) {
  if (ignoreWelcomeMessage) {
    io.engine.on('initial_headers', (headers) => {
      headers['set-cookie'] = cookie.serialize('hideWelcomeBox', 'true', {
        path: '/',
      })
    })
  }

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
      info('Client disconnected', reason, 'shutting down experiment in 60s')
      clearTimeout(socket.data.timeout)
      socket.data.timeout = setTimeout(() => {
        info('Shutting down experiment')
        socket.data.experiment.subscriptions.map((e) => e.unsubscribe())
      }, 60_000)
    })
  })
}
module.exports = {
  register,
}
