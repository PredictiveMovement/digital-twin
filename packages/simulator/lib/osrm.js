const fetch = require('node-fetch')
const polyline = require('polyline')
const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

const osrmUrl =
  // eslint-disable-next-line no-undef
  process.env.OSRM_URL ||
  'https://osrm.telge.iteam.pub' ||
  'http://localhost:5000'
const { warn, write } = require('./log')
const queue = require('./queueSubject')

const decodePolyline = function (geometry) {
  return polyline.decode(geometry).map((point) => ({
    lat: point[0],
    lon: point[1],
  }))
}

const encodePolyline = function (geometry) {
  return polyline.encode(geometry.map(({ lat, lon }) => [lat, lon]))
}

const CACHE_DIR = path.join(__dirname, '../.cache/osrm')

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

async function cachedFetch(method, params, fetchFunc) {
  const cacheKey = generateCacheKey(method, params)
  const cachedData = await getFromCache(cacheKey)

  if (cachedData) {
    return cachedData
  }

  const data = await fetchFunc()
  await saveToCache(cacheKey, data)
  return data
}

module.exports = {
  async route(from, to) {
    const coordinates = [
      [from.lon, from.lat],
      [to.lon, to.lat],
    ].join(';')

    return cachedFetch('route', { from, to }, () =>
      queue(() =>
        fetch(
          `${osrmUrl}/route/v1/driving/${coordinates}?steps=true&alternatives=false&overview=full&annotations=true`
        )
          .then(
            (res) =>
              (res.ok && res.json()) ||
              res.text().then((text) => Promise.reject(text))
          )

          // fastest route
          .then(
            (result) =>
              result.routes &&
              result.routes.sort((a, b) => a.duration < b.duration)[0]
          )
          .then((route) => {
            if (!route) return {}

            route.geometry = { coordinates: decodePolyline(route.geometry) }
            return route
          })
      )
    )
  },

  async nearest(position) {
    const coordinates = [position.lon, position.lat].join(',')
    const url = `${osrmUrl}/nearest/v1/driving/${coordinates}`
    write('n')

    return cachedFetch('nearest', { position }, () =>
      fetch(url).then(
        (response) => response.json(),
        (err) => {
          warn('OSRM fetch err', err.message, url)
          throw err
        }
      )
    )
  },

  async match(positions) {
    const coordinates = positions
      .map((pos) => [pos.position.lon, pos.position.lat].join(','))
      .join(';')
    const timestamps = positions
      .map((pos) => Math.round(+pos.date / 1000))
      .join(';')
    write('m')

    return cachedFetch('match', { positions }, () =>
      fetch(
        `${osrmUrl}/match/v1/driving/${coordinates}?timestamps=${timestamps}&geometries=geojson&annotations=true&overview=full`
      )
        .then((response) => response.json())
        .then((route) => route)
    )
  },

  decodePolyline,
  encodePolyline,
}
