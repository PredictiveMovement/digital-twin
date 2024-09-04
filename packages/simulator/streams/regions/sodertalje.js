const { stops } = require('../publicTransport')('sl')
const { filter, shareReplay } = require('rxjs')
const Region = require('../../lib/region')

const includedMunicipalities = [
  'Södertälje kommun',
]

const sodertalje = (municipalitiesStream) => {
  const municipalities = municipalitiesStream.pipe(
    filter((munipality) => includedMunicipalities.includes(munipality.name)),
    shareReplay()
  )

  return new Region({
    id: 'sodertalje',
    name: 'Södertälje',
    kommuner: municipalities,
    stops,
  })
}

module.exports = sodertalje
