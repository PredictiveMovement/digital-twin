const { from, defer, of, merge, asyncScheduler } = require('rxjs')
const { map, filter, concatMap, take, mergeMap} = require('rxjs/operators')

const address = require('./address')
console.log('*** Reading Postombud...')
const postombud = require('../streams/postombud')
console.log('*** Reading Population...')
const population = require('../streams/population')
const {haversine, addMeters} = require('../lib/distance')
const perlin = require('perlin-noise')

let id = 1

// from a position in the perlin noise we want to receive x and y position based on the index. It's row-major
const xy = (i, size = 10) => ({x: (i % size) * 100, y: (Math.floor(i / size)) * 100})

// generate static positions every 10m to add to the perlin noise to return valid addresses
// randomize bookings in a km square from a given postombud based on the population in the square and some perlin noise to select 
// an random address within that
function randomizeBookingsInArea(area, ombud) {
  return address.randomize(area.position).then(address => ({ombud, area, address}))
  // generate a 1000 x 1000 meters noise pattern which we can filter based on it's 
  return from().pipe(
    map(address => ({
      id: id++,
      bookingDate: new Date(),
      departure: ombud,
      destination: address,
    }))
  )
}

/*
  start with postombud, then find each km square around these postombud and 
*/
const ombud = kommun => postombud.pipe(filter(p => p.kommun === kommun))

/* 
  find all square km within range to the postombud
*/
const areas = population.pipe(
  concatMap(area => ombud('Arjeplog').pipe(
    map(postombud => ({area, postombud})),
    filter(({area, postombud}) => haversine(postombud.position, area.position) < 1000),
  ))
)


/* 
  generate bookings based on the population to and from valid addresses within those squares.
*/
const bookings = areas.pipe(
  concatMap(({area, postombud}) => randomizeBookingsInArea(area, postombud))
)


bookings.subscribe(booking => console.log('booking', booking))

module.exports = bookings