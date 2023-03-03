const { from, share } = require('rxjs')

const regions = {
  norrbotten: require('./norrbotten'),
  skane: require('./skane'),
}

const kommuner = require('../kommuner')

const region = process.env.REGION || 'skane'

module.exports = (savedParams) => {
  const kommunerStream = kommuner.read(savedParams)
  return from([regions[region](kommunerStream)]).pipe(share())
}
