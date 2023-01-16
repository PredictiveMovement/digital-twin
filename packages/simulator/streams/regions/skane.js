const Region = require('../../lib/region')
const { shareReplay, mergeMap, of, filter, tap } = require('rxjs')

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

    // NOTE: No buses in Skåne.
    stops: of([]).pipe(shareReplay()),
    stopTimes: of([]).pipe(shareReplay()),
    lineShapes: of([]).pipe(shareReplay()),
  })
}

module.exports = skane
