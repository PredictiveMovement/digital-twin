const _ = require('highland')
const hubs = require('../streams/postombud')
const bookings = require('../simulator/bookings')
const cars = require('../simulator/cars')
//const { booking_backlog } = require('../simulator/ljusdal/pinkCompany')

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

// booking_backlog.fork().each(b => console.log(`b: ${b.id}`))

function register(server) {

  server.get('/hubs', function (req, res) {
    res.send(hubs().filter((hub) => hub.kommun === 'Ljusdal'))
  })

  server.get('/bookings', async function (req, res) {
    res.send(await (Promise.all(bookings)))
  })

  server.get('/cars', function (req, res) {
    res.send(cars())
  })

  /*
    $cars.fork()
      .flatMap((car) => {
        return _('update', car)
      })
      .each(([event, car]) => {
        // console.debug('hej', { event })
        // Convert the car stream to an event emitter sending to anyone that's connected
        io.emit('car:event', { event, type: 'car', position: car.position, busy: car.busy, id: car.id })
      })
  
  
  
    // booking_backlog
    //   .fork()
    //   .each(booking => {
    //     console.log(`emitting ${booking.id}`)
    //     io.emit('booking:backlog', {
    //       // HEJ: 'hej'
    //       id: booking.id,
    //       'hej': 'hej '
    //       // departure: booking.departure,
    //       // destination: booking.destination,
    //       // booking_date: booking.bookingDate,
    //       // assigned_car: booking.car.id
    //     })
    //   })
  
    io.on('connection', function (socket) {
      socket.emit('test:debug', 'this works ye?')
  
      console.debug('connection')
  
      $hubs()
        .fork() // this works because there's a new stream for every connection
        // .filter(hub => in_viewport(viewport, hub.position))
        .tap(hub => console.log('hubb,', hub))
        .filter(hub => hub.kommun === 'Ljusdal')
        .map(hub => ({ type: 'hub', position: hub.position, id: hub.id }))
        .toArray(hubs => {
          socket.emit('hubs:join', hubs)
        })
  
      $bookings.observe()
        .map(booking => ({ type: 'booking', position: booking.destination, id: booking.id }))
        .batchWithTimeOrCount(1000, 200)
        .each(bookings => {
          console.log('bookings', bookings.length)
          socket.emit('bookings:join', bookings)
        })
    })
    */
}

module.exports = register

