require('dotenv').config()

const express = require('express')
var cors = require("cors");
const port = 4000
const server = express()
const routes = require('./routes')

server.use(cors());
routes(server)
server.listen(port)
