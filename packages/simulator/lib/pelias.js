const fetch = require('node-fetch')
const { info, debug, error } = require('./log')
const Position = require('./models/position')
const peliasUrl =
  process.env.PELIAS_URL || 'https://pelias.predictivemovement.se'

info('Pelias URL', peliasUrl)
module.exports = {
  nearest(position, layers = 'address,venue') {
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
        console.error(`Error in pelias nearest\n${error}\n${e}\n\n`)
      })

    return promise
  },
  search(name, near = null, layers = 'address,venue') {
    const focus = near
      ? `&focus.point.lat=${encodeURIComponent(
          near.lat
        )}&focus.point.lon=${encodeURIComponent(
          near.lon
        )}}&layers=${encodeURIComponent(layers)}`
      : ''
    const url = `${peliasUrl}/v1/search?text=${encodeURIComponent(
      name
    )}${focus}&size=1`
    debug('Pelias -> Search', url)
    process.stdout.write('p')
    return fetch(url)
      .then((response) => {
        if (!response.ok) throw 'pelias error: ' + response.statusText
        return response.json()
      })
      .then((p) => {
        process.stdout.write('pa')
        debug('Pelias -> Search', p)

        return p.features[0]?.geometry?.coordinates?.length
          ? p
          : Promise.reject('No coordinates found')
      })
      .then(({ features: [{ geometry, properties } = {}] = [] }) => ({
        ...properties,
        position: new Position({
          lon: geometry.coordinates[0],
          lat: geometry.coordinates[1],
        }),
      }))
      .catch((e) => {
        const peliasError = new Error().stack
        error(`Error in pelias search\n${peliasError}\n${e}\n\n`)
      })
  },
}
