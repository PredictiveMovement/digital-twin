const fetch = require('node-fetch')
const { info, error, write } = require('./log')
const Position = require('./models/position')
const peliasUrl = process.env.PELIAS_URL || 'https://pelias.telge.iteam.pub'
const queue = require('./queueSubject')
const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

info('Pelias URL', peliasUrl)

const CACHE_DIR = path.join(__dirname, '../.cache/pelias')

// Ensure cache directory exists
fs.mkdir(CACHE_DIR, { recursive: true }).catch(console.error)

function generateCacheKey(method, params) {
  const hash = crypto.createHash('md5')
  hash.update(`${method}:${JSON.stringify(params)}`)
  return hash.digest('hex')
}

async function getFromCache(cacheKey) {
  try {
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`)
    const data = await fs.readFile(cacheFile, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Cache read error:', error)
    }
    return null
  }
}

async function saveToCache(cacheKey, data) {
  try {
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`)
    await fs.writeFile(cacheFile, JSON.stringify(data))
  } catch (error) {
    console.error('Cache write error:', error)
  }
}

async function cachedFetch(method, params, fetchFunc, forceFetch = false) {
  const cacheKey = generateCacheKey(method, params)

  if (!forceFetch) {
    const cachedData = await getFromCache(cacheKey)
    if (cachedData) {
      return cachedData
    }
  }
  const data = await fetchFunc()
  await saveToCache(cacheKey, data)
  return data
}

const nearest = (position, layers = 'address,venue') => {
  const { lon, lat } = position

  const url = `${peliasUrl}/v1/reverse?point.lat=${lat}&point.lon=${lon}&size=1&layers=${layers}`
  return cachedFetch('nearest', { position, layers }, () =>
    queue(() => fetch(url))
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
              properties: {
                name,
                street,
                houseNumber,
                localadmin,
                label,
                postalcode,
              },
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
          postalcode,
        })
      )
      .catch((e) => {
        const err = new Error().stack
        error(`Error in pelias nearest\n${err}\n${e}\n\n`)
      })
  )
}

const search = (name, near = null, layers = 'address,venue', size = 1000) => {
  const encodedName = encodeURIComponent(name)
  const focus = near
    ? `&focus.point.lat=${near.lat}&focus.point.lon=${near.lon}&layers=${layers}`
    : ''
  const url = `${peliasUrl}/v1/search?text=${encodedName}${focus}&size=${size}`
  write('p')
  return cachedFetch('search', { name, near, layers, size }, () =>
    queue(() => fetch(url))
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
  )
}

const memoryCache = new Map()

const searchOne = async (name, near = null, layers = 'address,venue') => {
  const cacheKey = !near && name + layers
  if (cacheKey && memoryCache.has(cacheKey)) return memoryCache.get(cacheKey)
  const results = await search(name, near, layers, 1)
  if (cacheKey) memoryCache.set(cacheKey, results[0])
  return results[0]
}

module.exports = {
  nearest,
  search,
  searchOne,
}
