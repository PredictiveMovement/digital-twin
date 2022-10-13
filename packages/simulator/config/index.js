const projectName = process.env.PROJECT_NAME || 'rorla'

const projectConfig = require(`./${projectName}.config.js`)

module.exports = projectConfig
