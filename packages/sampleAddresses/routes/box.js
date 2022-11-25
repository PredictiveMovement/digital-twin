const express = require('express')
const app = express()
const assert = require('assert')

const query = (topleft, bottomright, size, seed) => ({
  size,
  query: {
    function_score: {
      query: {
        bool: {
          must: {
            match_all: {},
          },
          filter: {
            geo_bounding_box: {
              center_point: {
                top_left: { lon: topleft[0], lat: topleft[1] },
                bottom_right: {
                  lon: bottomright[0],
                  lat: bottomright[1],
                },
              },
            },
          },
        },
      },
      random_score: {
        seed,
        field: '_seq_no',
      },
    },
  },
})

const fetchAdresses = async (topleft, bottomright, seed, size) => {
  const peliasHostname = process.env.PELIAS_HOSTNAME || 'localhost:9200'
  const url = `http://${peliasHostname}/pelias/_search`

  const json = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(query(topleft, bottomright, size, seed)),
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => res.json())

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
  return addresses
}

// http://localhost:6000/box?topleft=13.085098058715708,57.96539874381225&bottomright=13.025098058715708,57.91539874381225
app.get('/', (req, res) => {
  const seed = req.query.seed || 1337
  const topleft = (req.query.topleft || req.query.tl)
    ?.split(',')
    .map(parseFloat)

  const bottomright = (req.query.bottomright || req.query.br)
    ?.split(',')
    .map(parseFloat)

  const size = req.query.size || 10

  assert(size <= 10000, 'Maximum size 10000')
  assert(
    topleft?.length === 2,
    'topleft is not a valid coordinate pair (lat,lon)'
  )
  assert(
    bottomright?.length === 2,
    'bottomright is not a valid coordinate pair (lat,lon)'
  )

  fetchAdresses(topleft, bottomright, seed, size).then((addresses) => {
    res.json(addresses)
  })
})

module.exports = app
