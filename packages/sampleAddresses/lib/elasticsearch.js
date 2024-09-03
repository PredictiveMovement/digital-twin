const fetch = require('node-fetch')
const fetchAdresses = async (query) => {
  const peliasHostname =
    process.env.PELIAS_HOSTNAME || 'http://localhost:9200'
  const url = `${peliasHostname}/pelias/_search`

  const json = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(query, null, 2),
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => res.json())

  if (json.error) {
    console.error('elastic error', json.error)
    throw new Error('Error in database query')
  }
  const hits = json.hits.hits
  const addresses = hits
    .map((hit) => hit)
    .map(
      ({
        _id: id,
        _source: {
          center_point: position,
          address_parts: address,
          name: { default: name } = {},
        },
      }) => ({
        address,
        name,
        position,
        id,
      })
    )
  return addresses
}

module.exports = {
  fetchAdresses,
}
