const express = require('express')
const app = express()
const assert = require('assert')
const { fetchAdresses } = require('../lib/elasticsearch')

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

app.get('/:zipnr', (req, res) => {
  const seed = parseFloat(req.query.seed) || 1337
  const zipnr = parseFloat(req.params.zipnr)
  const size = parseFloat(req.query.size) || 10
  assert(size <= 10000, 'Maximum size 10000')
  assert(zipnr > 0, 'Parameter: zipnr is required')

  fetchAdresses(query(zipnr, seed, size))
    .then((addresses) => {
      res.json(addresses)
    })
    .catch((err) => Promise.reject(err))
})

module.exports = app
