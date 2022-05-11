const fs = require('fs')
const XLSX = require('xlsx')

const readXlsx = (path, sheet) => {
  const buf = fs.readFileSync(path)
  const wb = XLSX.read(buf, { type: 'buffer' })

  return XLSX.utils.sheet_to_json(wb.Sheets[sheet])
}

module.exports = { readXlsx }
