const fetch = require('node-fetch')
const { info } = require('./log')
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
            { geometry, properties: { name, street, houseNumber, localadmin, label } } = {},
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
      ).catch((e) => {
        console.error('Error in pelias', e)
      })

    return promise
  },
  search(name, near = null, layers = 'address,venue') {
    const focus = near
      ? `&focus.point.lat=${near.lat}&focus.point.lon=${near.lon}}&layers=${layers}`
      : ''
    const url = `${peliasUrl}/v1/search?text=${name}${focus}&size=1`
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
        position: new Position({
          lon: geometry.coordinates[0],
          lat: geometry.coordinates[1],
        }),
      }))
  },
}
