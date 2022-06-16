require('dotenv').config()

const { env } = require('process')
const routes = require('./routers/routes')
const port = env.PORT || 4000

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

server.listen(port)
routes.register(io)
