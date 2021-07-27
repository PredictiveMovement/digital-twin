const osrm = require('./osrm')

const kr_per_meter = 13.60 / 1000
const kr_per_second = 575 / 60 / 60
const kr_per_trip = 45

function price (route) {
  return Math.round(kr_per_trip + route.distance * kr_per_meter + route.duration * kr_per_second)
}

function citynav () {
  // send request to api
}

function estimate (booking) {
  if (!booking.departure || !booking.destination) return Promise.resolve(booking)

  return osrm.route(booking.departure, booking.destination)
    .then(route => 
      Object.assign(booking, {
        estimated : {
          price: price(route),
          route,
          distance: route.distance,
          duration: route.duration
        }
      })
    .catch(err => console.error('No estimate was found', err) || Promise.resolve(booking))
  )
}

module.exports = {
  estimate,
  price
}
