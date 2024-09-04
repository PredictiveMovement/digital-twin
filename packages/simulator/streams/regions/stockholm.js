const { stops } = require('../publicTransport')('sl')
const { filter, shareReplay } = require('rxjs')
const Region = require('../../lib/region')

const includedMunicipalities = ['Södertälje kommun']

const stockholm = (municipalitiesStream) => {
  const municipalities = municipalitiesStream.pipe(
    filter((municipality) =>
      includedMunicipalities.includes(municipality.name)
    ),
    shareReplay()
  )

  return new Region({
    id: 'stockholm',
    name: 'Stockholm',
    kommuner: municipalities,
    stops,
  })
}

module.exports = stockholm
