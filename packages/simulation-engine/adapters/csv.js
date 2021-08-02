const fs = require('fs')
const parse = require('csv-parse')

const readCsv = (path, sheet) => {
  const input = fs.readFileSync(path)
  return parse(input, {
    columns: true,
    skip_empty_lines: true,

  })
}

module.exports = { readCsv }
