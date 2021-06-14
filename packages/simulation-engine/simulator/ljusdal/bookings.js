const _ = require('highland')
const address = require('../address')
const pinkData = require('./places')
const hub = { lat: 61.820734, lon: 16.058911 }

function getAddressFromData() {
  // pinkData
  const position = pinkData[Math.floor(Math.random() * pinkData.length)]
  return address.nearest(position)
  // .then((pos) => (pos === null ? randomize(center, retry--) : pos))
}

function getRandomAddressesAroundCenter() {
  return address.randomize(hub)
}

let id = 1

function randomizeBooking() {
  return Promise.all([address.randomize(), address.randomize()]).then(
    async (addresses) => ({
      id: id++,
      bookingDate: new Date(),
      departure: await getAddressFromData(),
      destination: await getRandomAddressesAroundCenter(),
    })
  )
}

const bookingStream = _(function (push, next) {
  console.log('randomizing booking')
  randomizeBooking()
    .then((booking) => {
      console.log('inside booking', booking)
      push(null, booking)
      next()
    })
    .catch(err => push(err))
})

module.exports = bookingStream

// const queue = bookingStream.fork()

// const nextBooking = () => new Promise(resolve => queue.pull((err, booking) => resolve(booking)))
// // car 1
// setInterval(() => {
//   nextBooking().then(booking => console.log('car 1 booking', booking))
// }, 1000)

// // car 2
// setInterval(() => {
//   nextBooking().then(booking => console.log('car 2 booking', booking))
// }, 1000)
