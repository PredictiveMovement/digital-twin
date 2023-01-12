const { take, map, filter, mergeAll } = require('rxjs/operators')
const { randomNames } = require('../lib/personNames')
const Citizen = require('../lib/models/citizen')
const { from, zip } = require('rxjs')
const { getAddressesInArea } = require('./address')

const getCitizensInSquare = (
  { position, area, population, ages },
  workplaces,
  kommunName
) => {
  const nrOfCitizens = Math.floor(population * 0.01) // sample x% of the population
  if (nrOfCitizens === 0) return from([])
  const addresses = from(getAddressesInArea(position, area, nrOfCitizens)).pipe(
    mergeAll()
  )
  return zip([
    addresses,
    randomNames.pipe(take(nrOfCitizens)),
    workplaces,
  ]).pipe(
    map(([home, name, workplaces]) => {
      return (
        home &&
        new Citizen({
          ...name,
          home,
          // age: ages[Math.floor(Math.random() * ages.length)],
          workplace: workplaces.sort((a, b) =>
            a.id.includes('venue') || b.id.includes('venue')
              ? -1
              : Math.random() - 0.5
          )[0],
          kommun: kommunName,
          position: home.position,
        })
      )
    }),
    filter((citizen) => citizen),
    take(nrOfCitizens)
  )
}

module.exports = {
  getCitizensInSquare,
}
