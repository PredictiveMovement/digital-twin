const { stops, stopTimes, lineShapes } = require('../publicTransport')
const { generatePassengers } = require('../../simulator/passengers')
const Region = require('../../lib/region')
const { shareReplay, mergeMap } = require('rxjs')

const norrbotten = (kommuner) =>
  new Region({
    name: 'Norrbotten',
    id: 'norrbotten',
    stops: stops.pipe(shareReplay()), // todo: support more regions
    stopTimes: stopTimes.pipe(shareReplay()),
    citizens: kommuner.pipe(mergeMap((kommun) => kommun.citizens)),
    lineShapes: lineShapes.pipe(shareReplay()),
    kommuner,
  })

module.exports = norrbotten
