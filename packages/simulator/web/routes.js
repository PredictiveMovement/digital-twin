const engine = require('../index')
const { save } = require('../config')
const { info } = require('../lib/log')
const { emitters, ignoreWelcomeMessage } = require('../config')
const cookie = require('cookie')
const moment = require('moment')

const defaultEmitters = emitters()

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
    defaultEmitters.includes('passengers') &&
      require('./routes/passengers').register(experiment, socket),
    defaultEmitters.includes('postombud') &&
      require('./routes/postombud').register(experiment, socket),
    require('./routes/time').register(experiment, socket),
    require('./routes/log').register(experiment, socket),
  ]
    .filter((f) => f)
    .flat()
}

function start(socket) {
  const experiment = engine.createExperiment({ defaultEmitters })
  socket.data.experiment = experiment
  experiment.subscriptions = subscribe(experiment, socket)
  experiment.virtualTime.waitUntil(moment().endOf('day').valueOf()).then(() => {
    socket.emit('reset')
    info('Experiment finished. Restarting...')
    process.kill(process.pid, 'SIGUSR2')
  })
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

    socket.data.experiment.parameters.initMapState = {
      latitude: parseFloat(process.env.LATITUDE) || 65.0964472642777,
      longitude: parseFloat(process.env.LONGITUDE) || 17.112050188704504,
      zoom: parseInt(process.env.ZOOM) || 5,
    }

    socket.emit('parameters', socket.data.experiment.parameters)
    socket.data.emitCars = defaultEmitters.includes('cars')
    socket.data.emitTaxiUpdates = defaultEmitters.includes('taxis')
    socket.data.emitBusUpdates = defaultEmitters.includes('buses')

    socket.emit('init')
    socket.on('reset', () => {
      socket.data.experiment.subscriptions.map((e) => e.unsubscribe())
      start(socket)
    })

    socket.on('carLayer', (val) => (socket.data.emitCars = val))
    socket.on('taxiUpdatesToggle', (val) => (socket.data.emitTaxiUpdates = val))
    socket.on('busUpdatesToggle', (val) => (socket.data.emitBusUpdates = val))
    socket.on('experimentParameters', (value) => {
      info('New expiriment settings: ', value)
      save(value)
      socket.emit('init')
    })

    socket.emit('parameters', socket.data.experiment.parameters)

    /* 
    
    This code is used to shut down the experiment if the client disconnects. it is currently disabled.
    It saves a lot of resources on the server, but it is also a bit annoying for the user.

    socket.on('connect', () => {
      if (socket.data.timeout) {
        info('Client connected again, cancelling shutdown')
        clearTimeout(socket.data.timeout)
      }
    })
*/
    /*socket.on('disconnect', (reason) => {
      info('Client disconnected', reason, 'Removing subscriptions..')
      socket.data.experiment.subscriptions.map((e) => e.unsubscribe())
    })*/
  })
}
module.exports = {
  register,
}
