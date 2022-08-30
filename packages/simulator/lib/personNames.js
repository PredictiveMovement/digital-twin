const {
  from,
  repeat,
  groupBy,
  mergeAll,
  mergeMap,
  toArray,
  map,
  merge,
  count,
  range,
  mapTo,
  shareReplay,
  combineLatest,
  withLatestFrom,
  zip,
} = require('rxjs')
const fornamn = require('../data/svenska_tilltalsnamn_2021.json').data
const efternamn = require('../data/svenska_efternamn_2021.json').data

const sampleDistribution = (nrOfGroups) => (distribution) =>
  from(distribution).pipe(
    map((name, i) => ({
      name,
      frequency: Math.ceil(nrOfGroups / (i + 1)),
    })),
    groupBy(({ frequency }) => frequency),
    mergeMap((group) =>
      group.pipe(
        toArray(),
        map((arr) => arr.sort((a) => Math.random() - 0.5)),
        mergeMap((arr) => range(0, group.key).pipe(mapTo(arr))), // repeat x times
        mergeAll(),
        map(({ name }) => name)
      )
    )
  )

const sortRandom = () => (stream) =>
  stream.pipe(
    toArray(),
    map((arr) => arr.sort((a, b) => Math.random() - 0.5)),
    mergeAll()
  )

const toToTitleCase = (str) =>
  str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join(' ')

const randomFornamn = () =>
  from(fornamn).pipe(sampleDistribution(200), sortRandom())

const randomEfternamn = () =>
  from(efternamn).pipe(
    map((name) => toToTitleCase(name)),
    sampleDistribution(200),
    sortRandom()
  )

const generateNames = () =>
  zip(randomFornamn(), randomEfternamn()).pipe(
    map(([firstName, lastName]) => ({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
    })),
    repeat()
  )

module.exports = {
  generateNames,
}
