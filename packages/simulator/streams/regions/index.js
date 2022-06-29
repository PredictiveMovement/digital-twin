const { from, share } = require('rxjs')
const norrbotten = require('./norrbotten')

module.exports = from([norrbotten]).pipe(share())
