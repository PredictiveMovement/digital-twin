const { stops, lineShapes } = require('../publicTransport')('skane')
const { filter, shareReplay } = require('rxjs')
const Region = require('../../lib/region')

const includedMunicipalities = ['Helsingborgs stad', 'Malmö stad', 'Lund']

const skane = (municipalitiesStream) => {
  const municipalities = municipalitiesStream.pipe(
    filter((munipality) => includedMunicipalities.includes(munipality.name))
  )

  return new Region({
    id: 'skane',
    name: 'Skåne',
    kommuner: municipalities,

    // Bus things.
    stops: stops.pipe(shareReplay()),
    lineShapes: lineShapes.pipe(shareReplay()),
  })
}

module.exports = skane
