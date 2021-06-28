require('dotenv').config()

const express = require('express')
const port = 4000

const server = express()
const routes = require('./routes')
routes(server)
server.listen(port)
