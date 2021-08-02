/**
 * TODO: Describe the stream that this file exports and what its data means
 */

const { from, lastValueFrom, shareReplay, Subject, ReplaySubject } = require('rxjs')
const {
  map,
  filter,
  toArray,
  concatMap,
  mergeMap,
  first,
  tap,
  mergeAll,
} = require('rxjs/operators')
const data = require('../data/kommuner.json')
const population = require('./population')
const packageVolumes = require('./packageVolumes')
const postombud = require('./postombud')
const inside = require('point-in-polygon')

function addPopulationSquares(kommun) {
  return population.pipe(
    filter(({ position: { lon, lat } }) =>
      kommun.geometry.coordinates.some(coordinates => inside([lon, lat], coordinates))
    ),
    map(({ position, population }) => ({ position, population })), // only keep the essentials to save memory
    toArray(),
    map(squares => ({ ...kommun, squares, population: squares.reduce((a, b) => a + b.total, 0)}))
  )
}

function addPackageVolumes(kommun) {
  return packageVolumes.pipe(
      first((vp) => kommun.name.startsWith(vp.name), {}),
      map(
        (packages) => ({
          ...kommun,
          packages,
        })
      ),
    )
}

function addPostombud(kommun) {
  return postombud.pipe(
    filter((ombud) => kommun.name.startsWith(ombud.kommun)),
    toArray(),
    map((postombud) => ({ ...kommun, postombud }))
  )
}

function read() {
  return from(data).pipe(
    map(
      ({
        geometry,
        namn: name,
        epost: email,
        postnummer: zip,
        telefon: telephone,
        kod: id,
      }) => ({
        geometry,
        name,
        id,
        email,
        zip,
        telephone,
      })
    ),
    tap((kommun) => console.log('*** read squares...', kommun.name)),
    mergeMap(addPopulationSquares),
    tap((kommun) => console.log('*** read packages...', kommun.name)),
    concatMap(addPackageVolumes),
    tap((kommun) => console.log('*** read ombud...', kommun.name)),
    concatMap(addPostombud),
    map(kommun => ({...kommun, unhandledBookings: new Subject()})),
    map(kommun => ({...kommun, cars: new ReplaySubject()})),
    shareReplay()
  )
  
}

const kommuner = module.exports = read()


// kommuner.pipe(filter((k) => k.name === 'Arjeplogs kommun')).subscribe((kommun) => console.dir(kommun, { depth: null }))
//population.pipe(take(50)).subscribe(p => console.dir(p,  { depth: null }))

//console.log('inside?', inside([17.1181455372, 58.6721047703], kommun))
