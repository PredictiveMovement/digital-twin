const parse = require('csv-parse')
const { from, toArray } = require('rxjs')
const { map } = require('rxjs/operators')
const { readCsv } = require('../adapters/csv')
const coords = require('swe-coords')
const { convertPosition } = require('../lib/distance')

// read the SWEREF99 x,y combined string for a square km and return a WGS84 lat lon object
// TODO: understand if the coordinate is the center of the square or the top left corner (if so, maybe add an offset to the position to get the center)
function parseRuta(ruta) {
  return convertPosition(coords.toLatLng(ruta.slice(6), ruta.slice(0, 6)))
}

function read() {
  return from(readCsv(process.cwd() + '/data/5arsklasser_1km.csv')).pipe(
    map(({ id, rutstorl: area, ruta, beftotalt: total, ...ages }) => ({
      id,
      area,
      ruta,
      position: parseRuta(ruta),
      ages,
      total,
    }))
  )
}

module.exports = read()
