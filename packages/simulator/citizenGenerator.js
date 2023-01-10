const fs = require('fs')
const {
  finalize,
  take,
  filter,
  mergeMap,
  concatMap,
  toArray,
  zipWith,
} = require('rxjs/operators')
const perlin = require('perlin-noise')

const pelias = require('./lib/pelias')
const { addMeters } = require('./lib/distance')
const { randomNames } = require('./lib/personNames')
const { randomize } = require('./simulator/address')
const kommuner = require('./streams/kommuner').read()
const { safeId } = require('./lib/id')
const log = require('./lib/log')

const NUMBER_OF_CITIZENS = 3000
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })

const execute = () => {
  console.log(`Generating and saving ${NUMBER_OF_CITIZENS} citizens`)
  generatePassengerDetails(kommuner, NUMBER_OF_CITIZENS).subscribe(
    citizenSerializer,
    console.error
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
      if (LOG_LEVEL === 'debug') process.stdout.write('🌆')
      return squares.pipe(
        mergeMap(({ population, position }) => {
          if (LOG_LEVEL === 'debug') process.stdout.write(' 🗺 ')
          return randomPositions
            .slice(0, population)
            .map(({ x, y }) => addMeters(position, { x, y }))
        }),
        mergeMap((homePosition) => {
          if (LOG_LEVEL === 'debug') process.stdout.write('📍')
          return postombud.pipe(
            toArray(),
            mergeMap(async (allPostombudInKommun) => {
              const randomPostombud =
                allPostombudInKommun[
                  Math.floor(Math.random() * allPostombudInKommun.length)
                ]
              try {
                const workPosition = await randomize(randomPostombud.position)
                return { homePosition, workPosition }
              } catch (err) {
                log.debug('timeout randomizing work position', err)
                return null
              }
            }, 20)
          )
        }, 20),
        filter((p) => p),
        concatMap(async ({ homePosition, workPosition }) => {
          if (LOG_LEVEL === 'debug') process.stdout.write('🏠')
          try {
            const home = await pelias.nearest(homePosition)
            return { home, workPosition }
          } catch (err) {
            log.debug('timeout/finding nearest address to home position', err)
            return null
          }
        }, 10),
        filter((p) => p),
        concatMap(async ({ home, workPosition }) => {
          if (LOG_LEVEL === 'debug') process.stdout.write('🏢')
          try {
            const work = await pelias.nearest(workPosition)
            return { home, work }
          } catch (err) {
            log.debug('timeout/finding nearest address to work position', err)
            return null
          }
        }),
        filter((p) => p),
        zipWith(
          randomNames.pipe(
            take(Math.min(100, Math.ceil(kommun.population * 0.01)))
          )
        ), // for some reason we need to limit the randomNames stream here, otherwise it will never end
        concatMap(async (zipf) => {
          const [{ home, work }, { firstName, lastName }] = zipf
          if (LOG_LEVEL === 'debug') process.stdout.write('📦')
          if (!home || !work || !firstName || !lastName) {
            return Promise.resolve(null)
          }
          return Promise.resolve({
            position: home.position,
            home: {
              name: `${home.name}, ${home.localadmin}`,
              position: home.position,
            },
            workplace: {
              name: `${work.name}, ${work.localadmin}`,
              position: work.position,
            },
            kommun: kommun.name,
            name: `${firstName} ${lastName}`,
          })
        }),
        filter((p) => p)
      )
    }),
    take(numberOfPassengers),
    toArray(),
    finalize()
  )
const saveFile = (citizens) => {
  try {
    const currentDirectory = __dirname
    const filePath = `${currentDirectory}/data/citizens.json`
    const jsonOutput = JSON.stringify(citizens, null, 2)
    fs.writeFileSync(filePath, jsonOutput)
    console.log(`\n\nSaved ${citizens.length} citizens to ${filePath}`)
  } catch (error) {}
}
const citizenSerializer = (citizens) => {
  serializedPassengers = citizens.map((citizen) => {
    const { name, home, workplace, kommun } = citizen
    if (LOG_LEVEL === 'info') process.stdout.write('💾')
    return {
      id: safeId(),
      name,
      home,
      workplace,
      kommun,
    }
  })
  saveFile(serializedPassengers, 'citizens.json')
}

execute()
