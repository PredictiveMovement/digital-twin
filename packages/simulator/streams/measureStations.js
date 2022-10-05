const { from, shareReplay } = require('rxjs')
const { map, filter } = require('rxjs/operators')
const { readXlsx } = require('../adapters/xlsx')
const sweCoords = require('swe-coords')

function execute() {
  return from(
    readXlsx(
      `${process.cwd()}/data/helsingborg/${
        process.env.transports_file || 'transports2021.xlsx'
      }`,
      `${process.env.transports_sheet || 'Blad1'}`
    )
  ).pipe(
    map(
      ({
        x,
        y,
        // 'HBG nr': hbgNr,
        // 'Traffic Web': trafficWeb,
        // Mätår: year,
        // Månad: month,
        // 'VaDT Tung': heavyTraficCount,
      }) => ({
        position: sweCoords.toLatLng(
          Math.floor(x).toString(),
          Math.floor(y).toString()
        ),
      })
    ),
    shareReplay()
  )
}

module.exports = execute()
