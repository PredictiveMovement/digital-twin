const { from, shareReplay } = require('rxjs')
const { map } = require('rxjs/operators')
const { readXlsx } = require('../adapters/xlsx')

function execute() {
  return from(readXlsx(
    `${process.cwd()}/data/${process.env.postombud_file || 'ombud.xlsx'}`,
    `${process.env.postombud_sheet || 'Sammanställning korr'}`
  )).pipe(
    map(({ X_WGS84, Y_WGS84, LevFrekv, OPERATÖR, DB_ID, KOMMUNNAMN }) => ({
      position: { lon: parseFloat(X_WGS84, 10), lat: parseFloat(Y_WGS84, 10) },
      operator: OPERATÖR,
      frequency: LevFrekv,
      id: DB_ID,
      kommun: KOMMUNNAMN,
    })),
    shareReplay()
  )
}

module.exports = execute()