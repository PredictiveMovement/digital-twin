const { stops, lineShapes } = require('../publicTransport')('norrbotten')
const { filter } = require('rxjs')
const Region = require('../../lib/region')

const includedMunicipalities = [
  'Arjeplogs kommun',
  'Arvidsjaurs kommun',
  'Bodens kommun',
  'Gällivare kommun',
  'Haparanda stad',
  'Jokkmokks kommun',
  'Kalix kommun',
  'Kiruna kommun',
  'Luleå kommun',
  'Pajala kommun',
  'Piteå kommun',
  'Storumans kommun',
  'Älvsbyns kommun',
  'Överkalix kommun',
  'Övertorneå kommun',
]

const norrbotten = (municipalitiesStream) => {
  const municipalities = municipalitiesStream.pipe(
    filter((munipality) => includedMunicipalities.includes(munipality.name))
  )

  return new Region({
    id: 'norrbotten',
    name: 'Norrbotten',
    kommuner: municipalities,

    // Bus things.
    stops,
    lineShapes,
  })
}

module.exports = norrbotten
