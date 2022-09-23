const chalk = require('chalk')

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

module.exports = {
  error: (title, error, data) => {
    console.error(`${chalk.redBright.bold('ERROR')} ${chalk.red(title)}`)
    console.error(error)
    if (data) {
      console.error(JSON.stringify(data, null, 2))
    }
  },
  info: (message, data = '') => {
    if (LOG_LEVEL !== 'info') {
      return
    }
    console.log(
      `${chalk.whiteBright.bold('INFO')} ${chalk.white(message)}`,
      data
    )
  },
}
