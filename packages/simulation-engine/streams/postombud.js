const _ = require('highland')
const { readXlsx } = require('../adapters/xlsx')

function execute() {
  const postombud = readXlsx(
    `${process.cwd()}/data/${process.env.postombud_file || 'ombud.xlsx'}`,
    `${process.env.postombud_sheet || 'Sammanställning korr'}`
  ).map(({ X_WGS84, Y_WGS84, LevFrekv, OPERATÖR, DB_ID, KOMMUNNAMN }) => ({
    position: { lon: parseFloat(X_WGS84, 10), lat: parseFloat(Y_WGS84, 10) },
    operator: OPERATÖR,
    frequency: LevFrekv,
    id: DB_ID,
    kommun: KOMMUNNAMN,
  }))
  return postombud
}

module.exports = execute
