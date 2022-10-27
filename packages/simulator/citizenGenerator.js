const fs = require('fs')
const {
  finalize,
  take,
  filter,
  mergeMap,
  concatMap,
  toArray,
  zipWith,
  tap,
  reduce,
  shareReplay,
} = require('rxjs/operators')
const { from, map} = require('rxjs')
const perlin = require('perlin-noise')

const config = require('./config')
const municipalityData = require('./data/kommuner.json')

const pelias = require('./lib/pelias')
const { addMeters } = require('./lib/distance')
const { randomNames } = require('./lib/personNames')
const { randomize } = require('./simulator/address')
const kommuner = require('./streams/kommuner')
const { safeId } = require('./lib/id')
const log = require('./lib/log')

const { getPopulationSquares, getPostombud } = require('./streams/kommunHelpers')
const population = require('./streams/population')

const AT_LEAST_NUMBER_OF_CITIZENS = 100
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })

const execute = () => {
  console.log(
    `Generating and saving ${AT_LEAST_NUMBER_OF_CITIZENS} citizens`
  )
  // generatePassengerDetails(kommuner, AT_LEAST_NUMBER_OF_CITIZENS).subscribe(
  //   citizenSerializer,
  //   console.error
  // )

  simplerGenerator()
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

const generateCitizensForMunicipalities = (municipalities, numberOfCitizens, totalPopulation) => {
  return from(municipalities).pipe(
    mergeMap(municipality => {
      const numberOfCitizensInMunicipality = Math.ceil(
        (municipality.population / totalPopulation) * numberOfCitizens
      )
      const citizens = generateCitizensForMunicipality(
        municipality,
        numberOfCitizensInMunicipality,
      )
      return citizens
    })
  )
}

const generateCitizensForMunicipality = async (municipality, numberOfCitizensInMunicipality) => {
  console.log('generateCitizensForMunicipality(...)', municipality.name)
  
  const citizens = await municipality.squares.map(async square => {
    const populationRatio = square.population / municipality.population
    const numberOfCitizens = populationRatio * numberOfCitizensInMunicipality
    return await generateCitizensInSquare(square, numberOfCitizens)
  })

  return citizens
}

const generateCitizensInSquare = async (square, numberOfCitizens) => {
  console.log('generateCitizensInSquare(...)', square)
  const { population, position } = square
  const citizens = []

  // randomPositions
  //           .slice(0, numberOfCitizens)
  //           .map(({ x, y }) => addMeters(position, { x, y }))

  for (let i = 0; i < numberOfCitizens; i++) {
    // TODO: Random position for each citizen (within the square)
    const {x,y} = randomPositions[0]
    const citizenPosition = addMeters(position, { x, y })
    const citizen = await generateCitizen(citizenPosition)
    citizens.push(citizen)
  }

  return citizens
}

const generateCitizen = async (position) => {
  const home = await getNearestAddressForPosition(position)
  const work = null
  const name = 'Ada'
  // const work = getNearestAddressForPosition(randomize(home.nearestPostalOmbud))
  // const name = randomNames()
  return new Citizen(name, home, work)
}

const getNearestAddressForPosition = async (position) => {
  // TODO: Lookup nearest address so home/work becomes a real place.
  return await pelias.nearest(homePosition)
}

/**
 * A simpler generator that hopefully does things right.
 */
const simplerGenerator = () => {
  read(config.includedMunicipalities).then(municipalities => {
    const totalPopulation = municipalities.reduce((acc, m) => (acc + m.population), 0)
    console.log(totalPopulation)
    
    return generateCitizensForMunicipalities(municipalities, AT_LEAST_NUMBER_OF_CITIZENS, totalPopulation).subscribe(
      citizenSerializer,
      console.error
    )
  });
}

const computeSquares = async (geometry) => {
  return new Promise((resolve, reject) => {
    getPopulationSquares(geometry).pipe(
      toArray(), 
      finalize()
    ).subscribe((squares) => { 
      resolve(squares)
    })
  })
}

const read = async (includedMunicipalities) => {
  return new Promise((resolve, reject) => {
    from(municipalityData).pipe(
      filter(({ namn }) =>
        includedMunicipalities.some((name) => namn.startsWith(name))
      ),
      mergeMap(
        async ({
          geometry,
          namn,
          kod,
        }) => {
          const squares = await computeSquares({geometry})
          // console.log('Squares', squares)
          return {
            geometry,
            name: namn,
            id: kod,
            // center: await Pelias.search(namn).then((res) => res.position),
            squares: squares.sort((a, b) => b.population - a.population),
            postombud: getPostombud(namn),
            population: squares.reduce((a, b) => a + b.population, 0),
          }
        }
      ),
      toArray(),
    ).subscribe(municipalities => {
      return resolve(municipalities)
    })
  })
}

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
  } catch (error) {

  }
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

