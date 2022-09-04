const {
  from,
  repeat,
  map,
  zip,
  take,
  filter,
  sample,
  debounce,
  toArray,
  pipe,
  mergeAll,
} = require('rxjs')
const fornamn = require('../data/svenska_tilltalsnamn_2021.json').data
const efternamn = require('../data/svenska_efternamn_2021.json').data

const shuffle = () =>
  pipe(
    toArray(),
    map((names) => names.sort(() => Math.random() - 0.5)), // shuffle the names
    mergeAll()
  )

const zipfDistribution = () =>
  pipe(
    map((name, i) => ({
      name,
      frequency: 1 / (i + 1), // Zipf distribution
    }))
  )
/**
 * Takes a distribution of names with frequency of use
 * and returns a stream of names according to the distribution
 * - meaning that the first name is more likely to be used than the second
 *
 * @returns stream of names
 */
const weightedRandom = () =>
  pipe(
    filter(({ frequency }) => frequency > Math.random()),
    map(({ name }) => name)
  )

const toToTitleCase = (str) =>
  str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join(' ')

const randomFirstName = () =>
  from(fornamn).pipe(zipfDistribution(), shuffle(), weightedRandom())

const randomLastName = () =>
  from(efternamn).pipe(
    zipfDistribution(),
    shuffle(),
    weightedRandom(),
    map((name) => toToTitleCase(name))
  )

const randomNames = zip(randomFirstName(), randomLastName()).pipe(
  map(([firstName, lastName]) => ({
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
  })),
  repeat()
)

module.exports = {
  randomNames,
}

// randomNames.pipe(take(10)).subscribe(console.log)
