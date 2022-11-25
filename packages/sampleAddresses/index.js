const express = require('express')
const app = express()
const zip = require('./routes/zip')
const box = require('./routes/box')

app.use('/zip', zip)
app.use('/box', box)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the PM sample addresses API',
    routes: {
      'GET /zip/:zipnr': 'Get addresses from a zip code',
      'GET /box/?topleft=lat,lon&bottomright=lat,lon':
        'Get addresses from a bounding box',
    },
    examples: [
      'GET /zip/11646?size=10&seed=1337',
      'GET /box/?topleft=55.5,12.5&bottomright=55.4,12.4',
      'GET /box/?tl=55.5,12.5&br=55.4,12.4',
    ],
    options: {
      seed: 'Random seed',
      size: 'Number of addresses to return',
    },
  })
})

// generic error handler in json format
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

const port = process.env.PORT || 4001
app.listen(port, () =>
  console.log(`Sample Addresses service listening on port ${port}!`)
)
