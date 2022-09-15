const fetch = require('node-fetch')
const { info } = require('./log')
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
          : Promise.reject('No coordinates found')
      )
      .then(
        ({
          features: [
            { geometry, properties: { name, street, houseNumber, label } } = {},
          ] = [],
        }) => ({
          name,
          street,
          houseNumber,
          label,
          position: {
            lon: geometry.coordinates[0],
            lat: geometry.coordinates[1],
          },
        })
      )

    return promise
  },
  search(name) {
    const url = `${peliasUrl}/v1/search?text=${name}`
    return fetch(url)
      .then((response) => {
        if (!response.ok) throw 'pelias error: ' + response.statusText
        return response.json()
      })
      .then((p) =>
        p.features[0]?.geometry?.coordinates?.length
          ? p
          : Promise.reject('No coordinates found')
      )
      .then(({ features: [{ geometry, properties } = {}] = [] }) => ({
        ...properties,
        position: {
          lon: geometry.coordinates[0],
          lat: geometry.coordinates[1],
        },
      }))
  },
}
