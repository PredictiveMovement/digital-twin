const { stops } = require('../publicTransport')('skane')
const { filter, shareReplay } = require('rxjs')
const Region = require('../../lib/region')

const includedMunicipalities = ['Södertälje kommun']

const skane = (municipalitiesStream) => {
  const municipalities = municipalitiesStream.pipe(
    filter((munipality) => includedMunicipalities.includes(munipality.name)),
    shareReplay()
  )

  return new Region({
    id: 'södertälje',
    name: 'SÖDERTÄLJE',
    kommuner: municipalities,
    stops,
  })
}

module.exports = skane
