require('dotenv').config()

const routes = require('./routes')
const port = 4000

const server = require('http').createServer()
const io = require('socket.io')(server, {
  // default cros package
  cors: {
    "origin": "*",
    "methods": "GET,HEAD,POST", // not default
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  }
})
server.listen(port)
routes.register(io)
