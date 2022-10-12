const {
  take,
  map,
  mergeMap,
  toArray,
} = require('rxjs/operators')

const Passenger = require('../lib/models/passenger')

const elastic = require('./../lib/elastic')
const { from } = require('rxjs')

const findPassengerNeeds = async (kommunName, limit) => {
  try {
    return await elastic.search({
      index: 'passengers',
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  source: 'generated',
                },
              },
              {
                match: {
                  kommun: kommunName,
                },
              },
            ],
          },
        },
        size: limit,
      },
    })
  } catch (error) {
    console.error("If there are no stored passenger, this error might be okay", error)
    return { body: { hits: { hits: [] } } }
  }
}

const passengersFromNeeds = (kommunName, numberOfPassengers = 250) => {
  if (numberOfPassengers > 250) { numberOfPassengers = 250 }
  return from(findPassengerNeeds(kommunName, numberOfPassengers)).pipe(
    mergeMap((results) => {
      return results.body.hits.hits
    }, 4),
    map(createPassengerFromAddress),
    take(numberOfPassengers),
  )
}

const createPassengerFromAddress = (hit) => {
  const { name, home, workplace, kommun, id } = hit._source
  return new Passenger({
    id,
    home,
    workplace,
    kommun,
    position: { lat: home.lat, lon: home.lon },
    startPosition: { lat: home.lat, lon: home.lon },
    name: name,
  })
}

module.exports = {
  passengersFromNeeds,
}
