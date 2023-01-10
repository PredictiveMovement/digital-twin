const { take, map, mergeAll } = require('rxjs/operators')
const fetch = require('node-fetch')
const { addMeters } = require('../lib/distance')
const { randomNames } = require('../lib/personNames')
const Citizen = require('../lib/models/citizen')
const { info } = require('../lib/log')
const { search } = require('../lib/pelias')

const getAddressesInBoundingBox = (topLeft, bottomRight, size = 10) =>
  fetch(
    `https://streams.predictivemovement.se/addresses/box?tl=${topLeft.lon},${topLeft.lat}&br=${bottomRight.lon},${bottomRight.lat}&size=${size}`
  ).then((res) => res.json())

const getAddressesInSquare = (position, area, population) => {
  const topLeft = addMeters(position, { x: area / 2, y: area / 2 })
  const bottomRight = addMeters(position, { x: -area / 2, y: -area / 2 })
  return getAddressesInBoundingBox(topLeft, bottomRight, population)
}

const getCitizensInSquare = async (
  { position, area, population, ages },
  kommun
) => {
  const nrOfCitizens = Math.floor(population * 0.05) // sample x% of the population
  const homeAdresses = await getAddressesInSquare(position, area, nrOfCitizens)
  return randomNames.pipe(
    map((name, i) => {
      const home = homeAdresses[i]
      const workplace = kommun.workplaces[i % kommun.workplaces.length]

      return (
        home &&
        new Citizen({
          ...name,
          home,
          // age: ages[Math.floor(Math.random() * ages.length)],
          workplace,
          kommun: kommun.name,
          position: home.position,
        })
      )
    }),
    take(nrOfCitizens)
  )
}

module.exports = {
  getCitizensInSquare,
}
