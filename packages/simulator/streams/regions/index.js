const { from, share } = require('rxjs')

const regions = {
  norrbotten: require('./norrbotten'),
  skane: require('./skane'),
}

const kommuner = require('../kommuner')

module.exports = (savedParams) => {
  const kommunerStream = kommuner.read(savedParams)
  return from([norrbotten(kommunerStream), skane(kommunerStream)]).pipe(share())
}
