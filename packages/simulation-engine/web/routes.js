const _ = require('highland')
// const engine = require('../index')
// const $available_cars = require('../simulator/ljusdal/pinkCompany.js')
// const $bookings = require('../simulator/ljusdal/bookings.js')

// const $car_positions = _()

// const last_car_positions = new Map()

// $available_cars
//   .zip($bookings)
//   .each(([car, booking]) => {

//     car.on('dropoff', () => {
//       console.debug('car dropoff')
//       $available_cars.write(car)
//     })

//     car.on('moved', () => {
//       // console.debug('car moved')
//       const obj = { id: car.id, position: car.position }
//       $car_positions.write(obj)
//       last_car_positions[car.id] = obj
//     })

//     car.handleBooking(booking)
//   })

function register(io) {
  io.on('connection', function (socket) {
    console.debug('connection')

    // socket.on('viewport', (viewport) => {
    //   // $cars.filter(contains(viewport))
    //   // socket.emit()
    // })
  })
}

module.exports = {
  register,
}
