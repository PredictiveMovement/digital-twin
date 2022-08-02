const { from, share } = require('rxjs')
const norrbotten = require('./norrbotten')

module.exports = (kommuner) => from([norrbotten(kommuner)]).pipe(share())
