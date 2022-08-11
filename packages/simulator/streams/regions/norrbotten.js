const { stops, stopTimes, lineShapes } = require('../publicTransport')
const { generatePassengers } = require('../../simulator/passengers')
const Region = require('../../lib/region')
const { shareReplay } = require('rxjs')

const norrbotten = (kommuner) =>
  new Region({
    name: 'Norrbotten',
    id: 'norrbotten',
    stops: stops.pipe(shareReplay()), // todo: support more regions
    stopTimes: stopTimes.pipe(shareReplay()),
    passengers: generatePassengers(kommuner),
    lineShapes: lineShapes.pipe(shareReplay()),
  })

module.exports = norrbotten
