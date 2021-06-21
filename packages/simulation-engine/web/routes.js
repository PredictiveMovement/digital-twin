const _ = require('highland')
const $hubs = require('../streams/postombud')
const $bookings = require('../simulator/bookings')
const $cars = require('../simulator/ljusdal/pinkCompany')

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


function register(io) {
  io.on('connection', function (socket) {
    console.debug('connection')

    socket.on('viewport', (viewport) => {
      console.debug('viewport')
      $hubs()
        .filter(hub => in_viewport(viewport, hub.position))
        .map(hub => ({ type: 'hub', position: hub.position, id: hub.id }))
        .toArray(hubs => {
          socket.emit('hubs:join', hubs)
        })

      const $relevantBookings =
        $bookings
          .fork()
          .filter(booking => in_viewport(viewport, booking.destination) || in_viewport(viewport, booking.departure))

      $relevantBookings
        .fork()
        .map(booking => ({ type: 'booking', position: booking.destination, id: booking.id }))
        .batchWithTimeOrCount(1000, 200)
        .each(bookings => {
          // console.log('bookings', bookings.length)
          socket.emit('bookings:join', bookings)
        })

      $cars
        .fork()
        .tap(() => console.log("car fork"))
        .zip($relevantBookings.fork())
        .tap(([car, booking]) => {
          console.debug('tappetytap')
          car.handleBooking(booking)
        })
        .flatMap(([car]) => {
          return _('update', car)
        })
        .each(([event, car]) => {
          console.debug({ event })
          socket.emit('car:event', { event, type: 'car', position: car.position, id: car.id })

        })
    })
  })
}

module.exports = {
  register,
}
