const {
  take,
  map,
  mergeMap,
  toArray,
  filter,
  tap,
} = require('rxjs/operators')
const { from } = require('rxjs')
const path = require('path')
const fs = require('fs')

const Citizen = require('../lib/models/citizen')
const { info } = require('../lib/log')

const readCitizensFile = () => {
  const dataDir = path.join(__dirname, '..', 'data')
  const citizensFileName = 'citizens.json'
  const file = path.join(dataDir, citizensFileName)
  return from(JSON.parse(fs.readFileSync(file)))
}


const getCitizens = (kommun, numberOfCitizens = 250) => {
  const kommunName = kommun.name
  if (numberOfCitizens > 250) { numberOfCitizens = 250 }
  info(`Getting ${numberOfCitizens} citizens for ${kommunName}.`)
  return readCitizensFile().pipe(
    filter((citizenData) => citizenData.kommun === kommunName),
    map((citizenData) => instantiateCitizen(citizenData, kommun)),
    take(numberOfCitizens)
  )
}

const instantiateCitizen = (citizenData, kommun) => {
  const { name, home, workplace, id } = citizenData
  return new Citizen({
    id,
    home,
    workplace,
    kommun,
    position: { lat: home.position.lat, lon: home.position.lon },
    startPosition: { lat: home.position.lat, lon: home.position.lon },
    name: name,
  })
}

module.exports = {
  getCitizens,
}
