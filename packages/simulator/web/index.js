require('dotenv').config()

const routes = require('./routes')
const port = 4000

const server = require('http').createServer()
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})
server.listen(port)
routes.register(io)
