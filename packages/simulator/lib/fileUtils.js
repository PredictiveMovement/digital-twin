const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, '..', 'data')
const paramsFileName = 'parameters.json'

// Saves a json parameter object to a parameter file in the data directory
const saveParameters = (value) => {
  const file = path.join(dataDir, paramsFileName)
  fs.writeFileSync(file, JSON.stringify(value, null, 2))
}

// Returns the json parameters as an object from the parameter file in the data directory
const readParameters = () => {
  const file = path.join(dataDir, paramsFileName)
  return JSON.parse(fs.readFileSync(file))
}

module.exports = {
  saveParameters,
  readParameters,
}
