const fs = require('fs')
const { from } = require('rxjs')
const { map, tap, toArray } = require('rxjs/operators')
const Booking = require('../lib/models/booking')
const { dirname: getDirName } = require('path')

const cleanBooking = ({
  id,
  origin,
  pickup: { position: pickup } = {},
  finalDestination: { position: finalDestination } = {},
  destination: { position: destination, name },
  type,
}) => ({
  id,
  origin,
  pickup: { position: pickup },
  finalDestination:
    (finalDestination && { position: finalDestination }) || undefined,
  destination: { position: destination, name },
  type
})

const write = (filename) => (stream) =>
  stream.pipe(
    map(cleanBooking),
    toArray(), // replace with stream writer
    tap((arr) => {
      fs.mkdir(getDirName(filename), { recursive: true }, (err) => {
        if (err) {
          console.error(err)
          return
        }
        fs.writeFileSync(filename, JSON.stringify(arr))
      })
    })
  )

const read = (filename) =>
  fs.existsSync(filename)
    ? from(JSON.parse(fs.readFileSync(filename))).pipe(
        map((b) => new Booking(b))
      )
    : from([])

module.exports = { read, write }
