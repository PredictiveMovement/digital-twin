const {
  take,
  map,
  mergeMap,
  toArray,
} = require('rxjs/operators')

const Passenger = require('../lib/models/passenger')

const elastic = require('./../lib/elastic')
const { from } = require('rxjs')

const findPassengerNeeds = (limit) => {
  return elastic.search({
    index: 'passenger_needs',
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                source: 'generated',
              },
            },
          ],
        },
      },
      size: limit,
    },
  })
}

const passengersFromNeeds = (numberOfPassengers = 250) => {
  if (numberOfPassengers > 250) { numberOfPassengers = 250 }
  return from(findPassengerNeeds(numberOfPassengers)).pipe(
    mergeMap((results) => {
      return results.body.hits.hits
    },4),
    map(createPassengerFromAddress),
    take(numberOfPassengers),
    toArray(),
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
