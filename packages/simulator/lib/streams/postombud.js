/**
 * List of hubs from postombud ljusdal
 */

const fs = require("fs");
const XLSX = require("xlsx");
const {from} = require('rxjs');
const { filter, take } = require("rxjs/operators");

const readXlsx = (path, sheet) => {
  const buf = fs.readFileSync(path);
  const wb = XLSX.read(buf, { type: "buffer" });

  return XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
};

const postombud = readXlsx(
  `${process.cwd()}/data/thefile.xlsx`,
  `Sammanställning korr`
).map(({ X_WGS84, Y_WGS84, LevFrekv, OPERATÖR, DB_ID, KOMMUNNAMN }) => ({
  position: { lon: parseFloat(X_WGS84, 10), lat: parseFloat(Y_WGS84, 10) },
  operator: OPERATÖR,
  frequency: LevFrekv,
  id: DB_ID,
  kommun: KOMMUNNAMN,
}))

module.exports = from(postombud)
  .pipe(
    filter(f => f.kommun == 'Ljusdal'),
    // take(2)
  )
