const { from, share } = require('rxjs')

const regions = {
  stockholm: require('./stockholm'),
}

const municipalities = require('../municipalities')

module.exports = (savedParams) => {
  const municipalitiesStream = municipalities.read(savedParams)
  const includedRegions = Object.entries(regions)
    .filter(
      ([region]) =>
        process.env.REGIONS?.includes(region) ||
        process.env.REGIONS === '*' ||
        !process.env.REGIONS
    )
    .map(([, region]) => region)
  return from(
    includedRegions.map((region) => region(municipalitiesStream))
  ).pipe(share())
}
