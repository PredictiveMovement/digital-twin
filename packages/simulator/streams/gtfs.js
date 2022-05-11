const fetch = require('node-fetch')
const key = process.env.TRAFIKLAB_KEY // log in to trafiklab.se and get a key
const operator = 'norrbotten_light'
const fs = require('fs')
const path = require('path')

//const url = `https://opendata.samtrafiken.se/gtfs/${operator}/${operator}.zip?key=${key}`
const gtfs = require('gtfs-stream')
const {shareReplay, from} = require('rxjs')
const {
  map,
  mergeMap,
  switchMap,
  filter,
  toArray,
  share,
  tap,
} = require('rxjs/operators')

const getGtfs = () => {
  return from(
    fs
      .createReadStream(path.join(__dirname, `../data/${operator}.zip`))
      .pipe(gtfs({raw: true}))
  ).pipe(shareReplay())
}

module.exports = {
    getGtfs,
}