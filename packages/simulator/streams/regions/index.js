const { from, share } = require('rxjs')

const regions = {
  norrbotten: require('./norrbotten'),
  skane: require('./skane'),
}

const kommuner = require('../kommuner')

module.exports = (savedParams) => {
  const kommunerStream = kommuner.read(savedParams)
  const includedRegions = Object.entries(regions)
    .filter(
      ([region]) =>
        process.env.REGIONS?.includes(region) ||
        process.env.REGIONS === '*' ||
        !process.env.REGIONS
    )
    .map(([_, region]) => region)
  return from(includedRegions.map((region) => region(kommunerStream))).pipe(
    share()
  )
}
