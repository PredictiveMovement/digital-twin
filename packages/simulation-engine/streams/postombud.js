const _ = require('highland')
const { readXlsx } = require('../adapters/xlsx')
const path = require('path')

const postombud = readXlsx(
  path.join(
    process.cwd(),
    'data/Ombudsnät 2021_till Predictive Movement.xlsx'
  ),
  `Sammanställning korr`
).map(({ X_WGS84, Y_WGS84, LevFrekv, OPERATÖR, DB_ID, KOMMUNNAMN }) => ({
  position: { lon: parseFloat(X_WGS84, 10), lat: parseFloat(Y_WGS84, 10) },
  operator: OPERATÖR,
  frequency: LevFrekv,
  id: DB_ID,
  kommun: KOMMUNNAMN,
}))

module.exports = () => _(postombud)
