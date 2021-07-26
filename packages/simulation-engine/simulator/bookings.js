const _ = require('highland')
const address = require('./address')
const postombud = require('../streams/postombud')
const population = require('../streams/population')
const {haversine, addMeters} = require('../lib/distance')
const perlin = require('perlin-noise')
const range = (length) => Array.from({ length }).map((value, i) => i)

let id = 1

// generate static positions every 10m to add to the perlin noise to return valid addresses
const coordinateOffests = range(0, 100).map(x => range(0, 100).map(y => ({x: -500 + x * 10 , y: -500 + y * 10})))

// randomize bookings in a km square from a given postombud based on the population in the square and some perlin noise to select 
// an random address within that
function randomizeBookingsInArea(area, ombud) {

  // generate a 1000 x 1000 meters noise pattern which we can filter based on it's 
  return _(perlin.generatePerlinNoise(100, 100, {}))
    .map(probability => probability * area.total / 10) // TODO: divide with accurate number based on amount of bookings per day
    .filter(probability => probability > 0.9)
    .flatMap((_, i) => _(address.nearest(addMeters(area.position, coordinateOffests[i]))))
    .map(address => ({
      id: id++,
      bookingDate: new Date(),
      departure: ombud,
      destination: address,
    }))
}

/*
  start with postombud, then find each km square around these postombud and 
*/
const ombud = kommun => postombud().filter(p => p.kommun === kommun)

/* 
  find all square km within range to the postombud
*/
const areas = population()
  .map(area => ombud('Arjeplog').map(postombud => ({area, postombud})))
  .tap(({area, postombud}) => console.log('area, postombud', area, postombud))
  .merge()
  .filter(({area, postombud}) => haversine(postombud.position, area.position) < 100000)

/* 
  generate bookings based on the population to and from valid addresses within those squares.
*/
const bookings = areas
  .fork()
  .map(({area, postombud}) => randomizeBookingsInArea(area, postombud))
  .merge()



module.exports = bookings