const { from, lastValueFrom } = require('rxjs')
const {
  map,
  take,
  filter,
  toArray,
  concatMap,
  tap,
  last,
  mergeAll,
} = require('rxjs/operators')
const data = require('../data/kommuner.json')
const population = require('./population')
const postombud = require('./postombud')
const inside = require('point-in-polygon')

async function read() {
  const squares = await lastValueFrom(population.pipe(toArray())) // read the stream once, for performance reasons
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
    map((kommun) => ({
      ...kommun,
      squares: squares
        .filter(({ position: { lon, lat } }) =>
          inside([lon, lat], kommun.geometry.coordinates[0])
        )
        .map(({ position, total }) => ({ position, total })), // only keep the essentials to save memory
    }))
  )
}

const kommuner = (module.exports = from(read()).pipe(mergeAll())) // we receive a promise so here we convert it to a stream

//kommuner.pipe(filter((k) => k.name === 'Arjeplogs kommun')).subscribe((kommun) => console.dir(kommun, { depth: null }))
//population.pipe(take(50)).subscribe(p => console.dir(p,  { depth: null }))

//console.log('inside?', inside([17.1181455372, 58.6721047703], kommun))
