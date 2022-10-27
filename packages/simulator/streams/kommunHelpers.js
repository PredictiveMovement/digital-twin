const { from } = require('rxjs')
const { filter, map, shareReplay } = require('rxjs/operators')

const population = require('./population')
const postombud = require('./postombud')
const measureStations = require('./measureStations')
const inside = require('point-in-polygon')
const commercialAreas = from(require('../data/scb_companyAreas.json').features)

module.exports = {
  getPopulationSquares: ({ geometry: { coordinates } }) => {
    return population.pipe(
      filter(({ position: { lon, lat } }) =>
        coordinates.some((coordinates) => inside([lon, lat], coordinates))
      ),
      map(({ position, population }) => ({ position, population })), // only keep the essentials to save memory
      shareReplay()
    )
  },
  
  getCommercialAreas: (kommunkod) => {
    return commercialAreas.pipe(
      filter((area) => area.properties.KOMMUNKOD === kommunkod),
      shareReplay()
    )
  },
  
  getPostombud: (kommunName) => {
    return postombud.pipe(
      filter((ombud) => kommunName.startsWith(ombud.kommun)),
      shareReplay()
    )
  },

  getMeasureStations: (kommunName) => {
    return measureStations.pipe(
      filter((measureStation) => kommunName.startsWith(measureStation.kommun)),
      shareReplay()
    )
  },
}