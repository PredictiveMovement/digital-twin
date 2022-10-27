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
const { from, map } = require('rxjs')
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

const {
  getPopulationSquares,
  getPostombud,
} = require('./streams/kommunHelpers')
const population = require('./streams/population')

const AT_LEAST_NUMBER_OF_CITIZENS = 100
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const xy = (i, size = 100) => ({ x: i % size, y: Math.floor(i / size) })

const execute = () => {
  console.log(`Generating and saving ${AT_LEAST_NUMBER_OF_CITIZENS} citizens`)
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

const generateCitizensForMunicipalities = (
  municipalities,
  numberOfCitizens,
  totalPopulation
) => {
  return from(municipalities).pipe(
    mergeMap(async (municipality) => {
      const numberOfCitizensInMunicipality = Math.ceil(
        (municipality.population / totalPopulation) * numberOfCitizens
      )
      const citizens = await generateCitizensForMunicipality(
        municipality,
        numberOfCitizensInMunicipality
      )

      // TODO: There is a problem with this mergeMap, we return empty citizens _before_ the generation is executed.
      return citizens
    })
  )
}

const onlyPopulatedSquares = (square) => square.population > 0

const generateCitizensForMunicipality = async (
  municipality,
  numberOfCitizensInMunicipality
) => {
  console.log(
    'generateCitizensForMunicipality(...)',
    municipality.name,
    municipality.population,
    numberOfCitizensInMunicipality
  )

  municipality.squares = municipality.squares.filter(onlyPopulatedSquares)
  municipality.squares = municipality.squares.map((square, i) =>
    enrichSquare(square, municipality, i, numberOfCitizensInMunicipality)
  )

  const pickedSquares = pickSquares(
    municipality,
    numberOfCitizensInMunicipality
  )
  return new Promise((resolve, reject) => {
    let citizens = []
    let iteration = 0
    try {
      pickedSquares.forEach(async (square) => {
        const result = await generateCitizenInSquare(
          square,
          iteration,
          municipality.postombud
        )
        iteration = result.iteration
        // if iteration > 10 000, set iteration to 0
        const citizen = {
          ...result.citizen,
          kommun: municipality.name,
        }
        console.log('Generated citizen', citizen)
        citizens.push(citizen)
      })
    } catch (error) {
      reject(error)
    }
    return resolve(citizens)
  })
}

const onPopulationRatio = (a, b) => b.populationRatio - a.populationRatio

const pickSquares = (municipality, numberOfCitizens) => {
  const result = []
  let squares = municipality.squares
  for (let i = numberOfCitizens; i > 0; i--) {
    squares = squares.sort(onPopulationRatio)
    result.push({ ...squares[0] })
    console.log(squares[0].name, squares[0].population)
    squares[0].populationRatio = squares[0].populationRatio * 0.8333
  }
  return result
}

const generateCitizenInSquare = async (square, iteration, postombud) => {
  const result = await getNearestAddressForPosition(square, iteration)
  iteration = result.iteration
  const home = result.address
  // TODO WORK
  const citizen = await generateCitizen(home)
  return { citizen, iteration }
}

const generateCitizen = async (position) => {
  const home = position
  const workplace = null
  const name = 'Ada'
  // const workplace = getNearestAddressForPosition(randomize(home.nearestPostalOmbud))
  // const name = randomNames()
  return {
    id: safeId(),
    name,
    home,
    workplace,
  }
  // return new Citizen(name, home, work)
}

const getNearestAddressForPosition = async (square, iteration) => {
  let address
  while (!address) {
    try {
      console.log('trying to get address', square.name, iteration)
      const position = addMeters(square.position, randomPositions[iteration])
      address = await pelias.nearest(position)
    } catch (error) {
      iteration += 1
    }
  }
  return { address, iteration }
}

/**
 * A simpler generator that hopefully does things right.
 */
const simplerGenerator = () => {
  read(config.includedMunicipalities).then((municipalities) => {
    const totalPopulation = municipalities.reduce(
      (acc, m) => acc + m.population,
      0
    )
    console.log(totalPopulation)

    return generateCitizensForMunicipalities(
      municipalities,
      AT_LEAST_NUMBER_OF_CITIZENS,
      totalPopulation
    ).subscribe(citizenSerializer, console.error)
  })
}

const computeSquares = async (geometry) => {
  return new Promise((resolve, reject) => {
    getPopulationSquares(geometry)
      .pipe(toArray(), finalize())
      .subscribe((squares) => {
        resolve(squares)
      })
  })
}

const enrichSquare = (square, municipality, i) => {
  const populationRatio = square.population / municipality.population
  const rOffset = Math.random() / 100 // all squares with same population should have different positions
  return {
    name: `${municipality.name} ${i + 1}`,
    populationRatio: populationRatio + rOffset,
    ...square,
  }
}

const read = async (includedMunicipalities) => {
  return new Promise((resolve, reject) => {
    from(municipalityData)
      .pipe(
        filter(({ namn }) =>
          includedMunicipalities.some((name) => namn.startsWith(name))
        ),
        mergeMap(async ({ geometry, namn, kod }) => {
          const squares = await computeSquares({ geometry })
          return {
            geometry,
            name: namn,
            id: kod,
            // center: await Pelias.search(namn).then((res) => res.position),
            squares: squares.sort((a, b) => b.population - a.population),
            postombud: getPostombud(namn),
            population: squares.reduce((a, b) => a + b.population, 0),
          }
        }),
        toArray()
      )
      .subscribe((municipalities) => {
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
