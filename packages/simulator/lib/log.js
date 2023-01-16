const chalk = require('chalk')

// eslint-disable-next-line no-undef
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const logLevelIsAtLeastDebug = LOG_LEVEL.toUpperCase() === 'DEBUG'
const logLevelIsAtLeastInfo =
  LOG_LEVEL.toUpperCase() === 'INFO' || logLevelIsAtLeastDebug
const logLevelIsAtLeastWarn =
  LOG_LEVEL.toUpperCase() === 'WARN' || logLevelIsAtLeastInfo

module.exports = {
  error: (title, error, data, ...rest) => {
    console.error(`${chalk.redBright.bold('ERROR')} ${chalk.red(title)}`)
    console.error(error)

    if (data) {
      console.error(JSON.stringify(data, null, 2), ...rest)
    }
  },
  debug: (title, message, data = '', ...rest) => {
    if (!logLevelIsAtLeastDebug) {
      return
    }

    console.debug(
      `${chalk.whiteBright.bold('DEBUG')} ${chalk.gray(title)} ${chalk.gray(
        message
      )}`
    )

    if (data) {
      console.error(JSON.stringify(data, null, 2), ...rest)
    }
  },
  info: (title, message, data = '', ...rest) => {
    if (!logLevelIsAtLeastInfo) {
      return
    }

    console.log(
      `${chalk.whiteBright.bold('INFO ')} ${chalk.white(title)} ${chalk.white(
        message
      )}`,
      data,
      ...rest
    )
  },
  warn: (title, message, data = '', ...rest) => {
    if (!logLevelIsAtLeastWarn) {
      return
    }

    console.log(
      `${chalk.red.bold('WARN ')} ${chalk.white(title)} ${chalk.white(
        message
      )}`,
      data,
      ...rest
    )
  },
}
