const _ = require("highland");
const { readXlsx } = require("../adapters/xlsx");

const postombud = readXlsx(
  `${process.cwd()}/data/${process.env.postombud_file}`,
  `${process.env.postombud_sheet}`
).map(({ X_WGS84, Y_WGS84, LevFrekv, OPERATÖR }) => ({
  position: [parseFloat(X_WGS84, 10), parseFloat(Y_WGS84, 10)],
  operator: OPERATÖR,
  frequency: LevFrekv,
}));

module.exports = _(postombud);
