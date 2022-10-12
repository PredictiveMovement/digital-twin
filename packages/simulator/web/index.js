require('dotenv').config()

const { env } = require('process')
const routes = require('./routes')
const port = env.PORT || 4000
let defaultEmitters = [
  'taxis',
  'buses',
  'busStops',
  'busLines',
  'passengers',
  'cars',
  'postombud',
  'kommuner',
  'bookings',
]

const ok = function (req, res) {
  res.writeHead(200)
  res.end('PM Digital Twin Engine. Status: OK')
}

const server = require('http').createServer(ok)

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

if (process.env.PROJECT_NAME === 'Helsingborg') {
  defaultEmitters = ['cars', 'postombud', 'kommuner', 'bookings', 'measureStations']
}

server.listen(port)
routes.register(io, defaultEmitters)
