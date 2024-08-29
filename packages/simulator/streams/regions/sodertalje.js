const { stops } = require('../publicTransport')('sodertalje')
const { filter } = require('rxjs')
const Region = require('../../lib/region')

const includedMunicipalities = [
  'Södertälje kommun',
]

const sodertalje = (municipalitiesStream) => {
  const municipalities = municipalitiesStream.pipe(
    filter((munipality) => includedMunicipalities.includes(munipality.name))
  )

  return new Region({
    id: 'sodertalje',
    name: 'Södertälje',
    kommuner: municipalities,

    // Bus things.
    stops,
  })
}

module.exports = sodertalje
