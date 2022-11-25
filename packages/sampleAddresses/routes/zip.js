const express = require('express')
const app = express()
const fetch = require('node-fetch')
const assert = require('assert')

app.get('/:zipnr', (req, res) => {
  const seed = req.query.seed || 1337
  const zipnr = req.params.zipnr
  const size = req.query.size || 10
  assert(size <= 10000, 'Maximum size 10000')

  const peliasHostname = process.env.PELIAS_HOSTNAME || 'localhost:9200'
  const url = `http://${peliasHostname}/pelias/_search`
  const query = {
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
  }

  fetch(url, {
    method: 'POST',
    body: JSON.stringify(query),
    headers: { 'Content-Type': 'application/json' },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.error) {
        throw new Error(json.error)
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
      res.json(addresses)
    })
    .catch((error) => {
      console.log(error)
      res.status(500).json(error.message)
    })
})

module.exports = app
