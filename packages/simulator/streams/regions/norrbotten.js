const { stops, stopTimes } = require('../publicTransport')
const Region = require('../../lib/region')
const { shareReplay } = require('rxjs')

const norrbotten = new Region({
  name: 'Norrbotten',
  id: 'norrbotten',
  stops: stops.pipe(shareReplay()), // todo: support more regions
  stopTimes: stopTimes.pipe(shareReplay()),
})

module.exports = norrbotten
