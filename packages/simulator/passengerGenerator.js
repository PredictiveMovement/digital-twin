const {
  finalize,
  take,
  filter,
  mergeMap,
  concatMap,
  toArray,
  zipWith
} = require('rxjs/operators')
const perlin = require('perlin-noise')

const pelias = require('./lib/pelias')
const { addMeters } = require('./lib/distance')
const { randomNames } = require('./lib/personNames')
const { randomize } = require('./simulator/address')
const kommuner = require('./streams/kommuner')
const { save } = require('./lib/elastic')
const { safeId } = require('./lib/id')

const NUMBER_OF_PASSENGERS = 100
const GENERATION_ID = safeId()
const DEBUG = process.env.DEBUG || false

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })

const execute = () => {
  console.log(
    `Generating and saving ${NUMBER_OF_PASSENGERS} passengers to elasticSearch as group ${GENERATION_ID}`
  )
  generatePassengerDetails(kommuner, NUMBER_OF_PASSENGERS).subscribe(
    passengerSerializer,
    console.error,
    finalLogger
  )
}

const finalLogger = () => {
  save(
    { needs: 'to_and_from_work', size: 50, GENERATION_ID },
      'passenger_generation'
    )
  console.log(
    `\n\nGenerated and saved ${NUMBER_OF_PASSENGERS} passengers to elasticSearch as group ${GENERATION_ID}`
  )
}

// generate a pattern of random positions so we can take x out of these and get a natural pattern of these positions
const randomPositions = perlin
  .generatePerlinNoise(100, 100)
  .map((probability, i) => ({
    x: xy(i).x * 10,
    y: xy(i).y * 10,
    probability,
  }))
  .sort((a, b) => b.probability - a.probability) // sort them so we can just pick how many we want

const generatePassengerDetails = (kommuner, numberOfPassengers) =>
  kommuner.pipe(
    mergeMap((kommun) => {
      const { squares, postombud, name } = kommun
      if (DEBUG) process.stdout.write('🌆')
      return squares.pipe(
        mergeMap(({ population, position }) => {
          if (DEBUG) process.stdout.write(' 🗺 ')
          return randomPositions
            .slice(0, population)
            .map(({ x, y }) => addMeters(position, { x, y }))
        }),
        mergeMap((homePosition) => {
          if (DEBUG) process.stdout.write('📍')
          return postombud.pipe(
            toArray(),
            mergeMap(async (allPostombudInKommun) => {
              const randomPostombud =
                allPostombudInKommun[Math.floor(Math.random() * allPostombudInKommun.length)]
              try {
                const workPosition = await randomize(randomPostombud.position)
                return { homePosition, workPosition }
              } catch (err) {
                if (DEBUG) console.warn('timeout randomizing work position', err)
                return null
              }
            }, 20)
          )
        }, 20),
        filter((p) => p),
        concatMap(async ({ homePosition, workPosition }) => {
          if (DEBUG) process.stdout.write('🏠')
          try {
            const home = await pelias.nearest(homePosition)
            return { home, workPosition }
          } catch (err) {
            if (DEBUG) console.warn('timeout/finding nearest address to home position', err)
            return null
          }
        }, 10),
        filter((p) => p),
        concatMap(async ({ home, workPosition }) => {
          if (DEBUG) process.stdout.write('🏢')
          try {
            const work = await pelias.nearest(workPosition)
            return { home, work }
          } catch (err) {
            if (DEBUG) console.warn('timeout/finding nearest address to work position', err)
            return null
          }
        }),
        filter((p) => p),
        zipWith(
          randomNames.pipe(take(Math.min(100, Math.ceil(kommun.population * 0.01))))
        ), // for some reason we need to limit the randomNames stream here, otherwise it will never end
        concatMap(async (zipf) => {
          const [{ home, work }, { firstName, lastName, name }] = zipf
          if(DEBUG) process.stdout.write('📦')
          return Promise.resolve({
            position: home.position,
            // home,
            // work,
            home: {
              name: `${home.name}, ${home.localadmin}`,
              ...home.position,
            },
            workplace: {
              name: `${work.name}, ${work.localadmin}`,
              ...work.position,
            },
            kommun: kommun.name,
            name,
            firstName,
            lastName,
          })
        })
      )
    }),
    take(numberOfPassengers),
    finalize()
  )
const passengerSerializer = ({ name, firstName, lastName, home, workplace, kommun }) => {
  const saveablePassenger = {
    id: safeId(),
    name,
    firstName,
    lastName,
    home,
    workplace,
    kommun,
    source: 'generated',
    generationGroupSize: NUMBER_OF_PASSENGERS,
    generationId: GENERATION_ID,
  }
  save(saveablePassenger, 'passengers')
  process.stdout.write('💾')
}

execute()

