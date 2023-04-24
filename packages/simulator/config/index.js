const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, '..', 'config')
const paramsFileName = 'parameters.json'

// Saves a json parameter object to a parameter file in the data directory
const save = (value) => {
  const file = path.join(dataDir, paramsFileName)
  fs.writeFileSync(file, JSON.stringify(value, null, 2))
}

// Returns the json parameters as an object from the parameter file in the data directory
const read = () => {
  const file = path.join(dataDir, paramsFileName)
  return JSON.parse(fs.readFileSync(file))
}

module.exports = {
  emitters: () => {
    const { emitters } = read()
    return emitters
  },
  municipalities: () => {
    const { fleets } = read()
    return Object.keys(fleets)
  },
  read,
  save,
}
