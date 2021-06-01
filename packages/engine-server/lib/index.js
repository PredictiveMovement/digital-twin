const routes = require('./routes')

const port = 4000

const server = require('http').createServer()
const io = require('socket.io')(server)
server.listen(port)
routes.register(io)
