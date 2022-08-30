const { from, repeat, map, zip, take, filter } = require('rxjs')
const fornamn = require('../data/svenska_tilltalsnamn_2021.json').data
const efternamn = require('../data/svenska_efternamn_2021.json').data

/**
 * Takes a list of names sorted on frequency of use
 * and returns a stream of names according to the distribution
 * - meaning that the first name is more likely to be used than the second
 *
 * @returns stream of names
 */
const weightedRandom = () => (distribution) =>
  from(distribution).pipe(
    map((name, i) => ({
      name,
      frequency: 3 / (i + 1), // Zipf distribution
    })),
    filter(({ frequency }) => frequency > Math.random() / 2),
    map(({ name }) => name)
  )

const toToTitleCase = (str) =>
  str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join(' ')

const randomFirstName = () => from(fornamn).pipe(weightedRandom())

const randomLastName = () =>
  from(efternamn).pipe(
    weightedRandom(),
    map((name) => toToTitleCase(name))
  )

const generateNames = () =>
  zip(randomFirstName(), randomLastName()).pipe(
    map(([firstName, lastName]) => ({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
    }))
  )

module.exports = {
  generateNames,
}
