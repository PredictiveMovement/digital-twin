const csv = require('csv-reader')
const _ = require('highland')
const fs = require('fs')
const input = fs.createReadStream(
  process.cwd() + '/data/5arsklasser_1km.csv',
  'utf8'
)
const coords = require('swe-coords')
const {convertPosition} = require('../lib/distance')

function execute() {
  const befolkning = _(
    input.pipe(
      new csv({
        parseNumbers: false,
        skipHeader: true,
        parseBooleans: true,
        trim: true,
      })
    )
  ).map(([id, area, north_east, ...ages]) => ({
    id,
    area,
    north_east,
    position: convertPosition(coords.toLatLng(north_east.slice(6), north_east.slice(0, 6))),
    ages,
    total: ages.reduce((a,b) => parseFloat(a, 10) + parseFloat(b, 10), 0)
  }))
  return befolkning
}

module.exports = execute