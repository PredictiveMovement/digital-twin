const Region = require('../../lib/region')
const { shareReplay, mergeMap, of } = require('rxjs')

const skane = (kommuner) =>
  new Region({
    name: 'Skåne',
    id: 'skane',
    stops: of([]).pipe(shareReplay()), // todo: support more regions
    stopTimes: of([]).pipe(shareReplay()),
    citizens: kommuner.pipe(mergeMap((kommun) => kommun.citizens)),
    lineShapes: of([]).pipe(shareReplay()),
    kommuner,
  })

module.exports = skane
