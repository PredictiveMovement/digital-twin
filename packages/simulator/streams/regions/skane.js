const { stops, lineShapes } = require('../publicTransport')('skane')
const { filter, shareReplay, tap, toArray, map } = require('rxjs')
const Region = require('../../lib/region')
const { isInsideCoordinates } = require('../../lib/polygon')

const includedMunicipalities = ['Helsingborgs stad', 'Malmö stad', 'Lund']

const skane = (municipalitiesStream) => {
  const municipalities = municipalitiesStream.pipe(
    filter((munipality) => includedMunicipalities.includes(munipality.name))
  )

  const activeStops = stops
    .pipe(
      // tap((stop) => {
      //   console.log('STOP', stop)
      // }),
      filter((stop) => {
        const stopCoordinates = [stop.position.lon, stop.position.lat]
        return municipalities.pipe(
          toArray(),
          map((municipality) => {
            const meow = isInsideCoordinates(
              stopCoordinates,
              municipality.geometry.coordinates
            )

            console.log('MEOW', meow)
          })
        )
      }),
      shareReplay()
    )
    .subscribe()

  return new Region({
    id: 'skane',
    name: 'Skåne',
    kommuner: municipalities,

    // Bus things.
    stops: stops.pipe(shareReplay()),
    lineShapes: lineShapes.pipe(shareReplay()),
  })
}

module.exports = skane
