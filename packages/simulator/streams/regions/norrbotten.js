const { stops, stopTimes } = require('../publicTransport')
const Region = require('../../lib/region')

const norrbotten = new Region({
  name: 'Norrbotten',
  id: 'norrbotten',
  stops, // todo: support more regions
  stopTimes,
})

module.exports = norrbotten
