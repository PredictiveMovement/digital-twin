const fetch = require('node-fetch')
const { info, error, write } = require('./log')
const Position = require('./models/position')
const peliasUrl =
  process.env.PELIAS_URL || 'http://pelias-api.pelias.svc.cluster.local:3100'

info('Pelias URL', peliasUrl)

const nearest = (position, layers = 'address,venue') => {
  const { lon, lat } = position

  const url = `${peliasUrl}/v1/reverse?point.lat=${lat}&point.lon=${lon}&size=1&layers=${layers}`
  const promise = fetch(url)
    .then((response) => {
      if (!response.ok) throw 'pelias error: ' + response.statusText
      return response.json()
    })
    .then((p) =>
      p.features[0]?.geometry?.coordinates?.length
        ? p
        : Promise.reject('No coordinates found' + position.toString())
    )
    .then(
      ({
        features: [
          {
            geometry,
            properties: { name, street, houseNumber, localadmin, label },
          } = {},
        ] = [],
      }) => ({
        name,
        street,
        houseNumber,
        label,
        localadmin,
        position: new Position({
          lon: geometry.coordinates[0],
          lat: geometry.coordinates[1],
        }),
      })
    )
    .catch((e) => {
      const error = new Error().stack
      error(`Error in pelias nearest\n${error}\n${e}\n\n`)
    })

  return promise
}
const search = (name, near = null, layers = 'address,venue', size = 1000) => {
  const encodedName = encodeURIComponent(name)
  const focus = near
    ? `&focus.point.lat=${near.lat}&focus.point.lon=${near.lon}&layers=${layers}`
    : ''
  const url = `${peliasUrl}/v1/search?text=${encodedName}${focus}&size=${size}`
  write('p')
  return fetch(url)
    .then((response) => {
      if (!response.ok) throw 'pelias error: ' + response.statusText
      return response.json()
    })
    .then((results) =>
      results.features
        .map(({ geometry, properties } = {}) => ({
          ...properties,
          position: new Position({
            lon: geometry.coordinates[0],
            lat: geometry.coordinates[1],
          }),
        }))
        .filter((p) => p.position.isValid())
    )
    .catch((e) => {
      const peliasError = new Error().stack
      error(`Error in pelias search\n${url}\n${peliasError}\n${e}\n\n`)
      return Promise.reject(new Error('Error in pelias', peliasError))
    })
}

const cache = new Map()

const searchOne = async (name, near = null, layers = 'address,venue') => {
  const cacheKey = !near && name + layers
  if (cacheKey && cache.has(cacheKey)) return cache.get(cacheKey)
  const results = await search(name, near, layers, 1)
  if (cacheKey) cache.set(cacheKey, results[0])
  return results[0]
}

module.exports = {
  nearest,
  search,
  searchOne,
}
