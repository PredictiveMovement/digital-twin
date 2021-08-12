const fetch = require('node-fetch')
const peliasUrl = process.env.PELIAS_URL || 'https://pelias.iteamdev.io'

console.log('Pelias URL', peliasUrl)
module.exports = {
  nearest(position) {
    console.log('getting pelias')
    const url = `${peliasUrl}/v1/reverse?point.lat=${position.lat}&point.lon=${position.lon}&size=1&layers=address,venue`
    const promise = fetch(url)
      .then((response) => {
        if (!response.ok) throw "pelias error: " + response.statusText
        return response.json()
      })
      .then(p => p.features[0].geometry?.coordinates?.length ? p : Promise.reject('No coordinates found'))
      .then(({ features: [{ geometry, properties } = {}] = [] }) => ({
        ...properties,
        position: { lon: geometry.coordinates[0], lat: geometry.coordinates[1] },
      }))

    return promise
  },
}
