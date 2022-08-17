const {
  takeUntil,
  tap,
  take,
  filter,
  mergeMap,
  mergeAll,
  concatMap,
  toArray,
  shareReplay,
} = require('rxjs/operators')
const { timer, bufferTime, windowTime } = require('rxjs')
const moment = require('moment')
const perlin = require('perlin-noise')

const pelias = require('../lib/pelias')
const { addMeters } = require('../lib/distance')
const { safeId } = require('../lib/id')
const Passenger = require('../lib/models/passenger')
const personNames = require('../lib/personNames')
const { virtualTime } = require('./../lib/virtualTime')

const polarbrödÄlvsByn = {
  lat: 65.669641,
  lon: 20.975453,
  name: 'Polarbröd Älvsbyn',
}

const names = personNames.read()

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })

// generate a pattern of random positions so we can take x out of these and get a natural pattern of these positions
const randomPositions = perlin
  .generatePerlinNoise(100, 100)
  .map((probability, i) => ({
    x: xy(i).x * 10,
    y: xy(i).y * 10,
    probability,
  }))
  .sort((a, b) => b.probability - a.probability) // sort them so we can just pick how many we want

const generatePassengers = (kommuner) =>
  kommuner.pipe(
    mergeMap(({ squares }) =>
      squares.pipe(
        mergeMap(({ population, position }) =>
          randomPositions
            .slice(0, population)
            .map(({ x, y }) => addMeters(position, { x, y }))
        ),
        concatMap((position) =>
          pelias
            .nearest(position)
            .then(createPassengerFromAddress)
            .catch((_) => null)
        ),
        filter((p) => p !== null)
      )
    ),

    take(100),
    shareReplay(), // ShareReplay needed to keep ID's and names consistent between console and visualisation
    toArray()
  )
const createPassengerFromAddress = async ({ position }) => {
  const hemma = { name: 'Hemma', ...position}
  // Everyone goes to and from work, between 5am and 10am and returns between 3pm and 8pm.
  // TODO: Also, everyone works at Polarbröd in Älvsbyn
  const offset = virtualTime.offset // Sim starts at an offset from midnight, so we need to subctract that offset from the time
  const fiveAm  = (5 * 60 * 60) - offset
  const tenAm   = (10 * 60 * 60) - offset
  const threePm = (15 * 60 * 60) - offset
  const eightPm = (20 * 60 * 60) - offset
  const name = names[Math.floor(Math.random() * names.length)]

  return new Passenger({
    journeys: [
      { id: safeId(), pickup: hemma, destination: polarbrödÄlvsByn, timeWindow: [[fiveAm, tenAm]], status: 'Väntar' },
      { id: safeId(), pickup: polarbrödÄlvsByn, destination: hemma, timeWindow: [[threePm, eightPm]], status: 'Väntar' },
    ],
    id: safeId(),
    position: position,
    name: name,
  })
}


module.exports = {
  generatePassengers,
}
