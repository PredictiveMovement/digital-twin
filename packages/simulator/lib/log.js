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
  debug: (message, data = '') => {
    if (LOG_LEVEL !== 'DEBUG') {
      return
    }
    console.log(
      `${chalk.whiteBright.bold('DEBUG')} ${chalk.white(message)}`,
      data
    )
  },
  info: (message, data = '') => {
    if (LOG_LEVEL !== 'info' && LOG_LEVEL !== 'DEBUG') {
      return
    }
    console.log(
      `${chalk.whiteBright.bold('INFO')} ${chalk.white(message)}`,
      data
    )
  },
}
