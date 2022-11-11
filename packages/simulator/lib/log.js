const chalk = require('chalk')

// eslint-disable-next-line no-undef
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

module.exports = {
  error: (title, error, data, ...rest) => {
    console.error(`${chalk.redBright.bold('ERROR')} ${chalk.red(title)}`)
    console.error(error)
    if (data) {
      console.error(JSON.stringify(data, null, 2), ...rest)
    }
  },
  debug: (message, data = '', ...rest) => {
    if (LOG_LEVEL !== 'DEBUG') {
      return
    }
    console.log(
      `${chalk.whiteBright.bold('DEBUG')} ${chalk.white(message)}`,
      data,
      ...rest
    )
  },
  info: (message, data = '', ...rest) => {
    if (LOG_LEVEL !== 'info' && LOG_LEVEL !== 'DEBUG') {
      return
    }
    console.log(
      `${chalk.whiteBright.bold('INFO')} ${chalk.white(message)}`,
      data,
      ...rest
    )
  },
  warn: (message, data = '', ...rest) => {
    if (LOG_LEVEL !== 'info' && LOG_LEVEL !== 'DEBUG') {
      return
    }
    console.log(
      `${chalk.whiteBright.bold('INFO')} ${chalk.white(message)}`,
      data,
      ...rest
    )
  },
}
