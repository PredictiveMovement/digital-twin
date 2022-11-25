const express = require('express')
const app = express()
const fetch = require('node-fetch')
const assert = require('assert')

const query = (zipnr, seed, size) => ({
  query: {
    function_score: {
      query: {
        wildcard: {
          'address_parts.zip': zipnr,
        },
      },
      random_score: {
        seed: seed,
        field: '_seq_no',
      },
    },
  },
  size: size,
})

const fetchAdresses = async (zipnr, seed, size) => {
  const peliasHostname = process.env.PELIAS_HOSTNAME || 'localhost:9200'
  const url = `http://${peliasHostname}/pelias/_search`

  const json = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(query(zipnr, seed, size)),
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => res.json())

  if (json.error) {
    console.log('elastic error', json.error)
    throw new Error('Error in database query')
  }
  const hits = json.hits.hits
  const addresses = hits
    .map((hit) => hit)
    .map(
      ({
        _id: id,
        _source: { center_point: position, address_parts: address },
      }) => ({
        address,
        position,
        id,
      })
    )
  return addresses
}

app.get('/:zipnr', (req, res) => {
  const seed = req.query.seed || 1337
  const zipnr = +req.params.zipnr
  const size = req.query.size || 10
  assert(size <= 10000, 'Maximum size 10000')
  assert(zipnr, 'Parameter: zipnr is required')

  fetchAdresses(zipnr, seed, size)
    .then((addresses) => {
      res.json(addresses)
    })
    .catch((err) => {
      res.status(500).json({ error: err.message })
    })
})

module.exports = app
