const { stops, lineShapes } = require('../publicTransport')('skane')
const { filter, shareReplay, map } = require('rxjs')
const Region = require('../../lib/region')
const { isInsideCoordinates } = require('../../lib/polygon')

const includedMunicipalities = [
  'Helsingborgs stad',
  'Malmö stad',
  'Lunds kommun',
]

const skane = (municipalitiesStream) => {
  const municipalities = municipalitiesStream.pipe(
    filter((munipality) => includedMunicipalities.includes(munipality.name)),
    shareReplay()
  )

  const geometries = []
  municipalities
    .pipe(
      map((municipality) => {
        geometries.push({
          name: municipality.name,
          coordinates: municipality.geometry.coordinates,
        })
      })
    )
    .subscribe()

  /**
   * Include line shapes that have at least one stop inside the active municipalities.
   */
  const localLineShapes = lineShapes.pipe(
    filter((lineShape) => {
      let lineShapeHasAnyStopInsideActiveMunicipalities = false
      geometries.forEach((geometry) => {
        lineShape.stops.forEach((stop) => {
          if (isInsideCoordinates(stop, geometry.coordinates)) {
            lineShapeHasAnyStopInsideActiveMunicipalities = true
          }
        })
      })

      return lineShapeHasAnyStopInsideActiveMunicipalities
    }),
    shareReplay()
  )

  return new Region({
    id: 'skane',
    name: 'Skåne',
    kommuner: municipalities,
    stops,

    // Bus things.
    lineShapes: localLineShapes.pipe(shareReplay()),
  })
}

module.exports = skane
