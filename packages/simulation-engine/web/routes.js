const _ = require('highland')
const $hubs = require('../streams/postombud')
const $bookings = require('../simulator/bookings')
const $cars = require('../simulator/cars')
const { booking_backlog } = require('../simulator/ljusdal/pinkCompany')

const viewport = [
  [12.789348659070175, 59.66324274595559],
  [14.986614284069821, 60.48531682744461],
]

function in_viewport(viewport, point) {
  const [sw, ne] = viewport
  const [west, south] = sw
  const [east, north] = ne

  return (
    west <= point.lon && point.lon <= east
    &&
    south <= point.lat && point.lat <= north
  )
}
/*
  Antaganden:
  1. ? Simuleringen ska köra även om ingen tittar på den
  2. Alla klienter ska (ha chansen att) få alla uppdateringar
  3. En långsam observatör/klient/browser ska inte sakta ner simuleringen för alla
  dvs -> strömmar internt men event emitter ut till klienterna?
*/

function register(io) {

  $cars.fork()
    .flatMap((car) => {
      return _('update', car)
    })
    .each(([event, car]) => {
      console.debug('hej', { event })
      // Convert the car stream to an event emitter sending to anyone that's connected
      io.emit('car:event', { event, type: 'car', position: car.position, busy: car.busy, id: car.id })
    })

  io.on('connection', function (socket) {
    console.debug('connection')

    $hubs()
      .fork() // this works because there's a new stream for every connection
      // .filter(hub => in_viewport(viewport, hub.position))
      .filter(hub => hub.kommun === 'Ljusdal')
      .map(hub => ({ type: 'hub', position: hub.position, id: hub.id }))
      .toArray(hubs => {
        socket.emit('hubs:join', hubs)
      })

    $bookings.observe()
      // .filter(booking => in_viewport(viewport, booking.destination) || in_viewport(viewport, booking.departure))
      .map(booking => ({ type: 'booking', position: booking.destination, id: booking.id }))
      .batchWithTimeOrCount(1000, 200)
      .each(bookings => {
        console.log('bookings', bookings.length)
        socket.emit('bookings:join', bookings)
      })
  })
}

module.exports = {
  register,
}
