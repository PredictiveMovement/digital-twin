const { stops, stopTimes, lineShapes } = require('../publicTransport')
const { of, filter, Subject, shareReplay } = require('rxjs')
const Region = require('../../lib/region')

const includedMunicipalities = ['Helsingborgs stad']

const skane = (municipalitiesStream) => {
  const municipalities = municipalitiesStream.pipe(
    filter((munipality) => includedMunicipalities.includes(munipality.name))
  )

  return new Region({
    id: 'skane',
    cats: 4,
    name: 'Skåne',
    kommuner: municipalities,

    // Bus things.
    stops: stops.pipe(shareReplay()),
    stopTimes: stopTimes.pipe(shareReplay()),
    lineShapes: lineShapes.pipe(shareReplay()),
  })
}

module.exports = skane
