const {toArray} = require('rxjs/operators')
const {events, bookings} = require('../run')
const hubs = require('../lib/streams/postombud')


function register(server) {
  server.get('/hubs', function (req, res) {
    res.send(hubs)

  })

  server.get('/bookings', async function (req, res) {
    res.send(bookings)
  })

  server.get('/car_events', function (req, res) {
    res.send(events)
  })

}

module.exports = register

