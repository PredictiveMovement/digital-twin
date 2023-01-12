const { from, share } = require('rxjs')
const norrbotten = require('./norrbotten')
const skane = require('./skane')

module.exports = (kommuner) =>
  from([norrbotten(kommuner), skane(kommuner)]).pipe(share())
