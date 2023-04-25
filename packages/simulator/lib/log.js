const chalk = require('chalk')
const { ReplaySubject } = require('rxjs')

// eslint-disable-next-line no-undef
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const logLevelIsAtLeastDebug = LOG_LEVEL.toUpperCase() === 'DEBUG'
const logLevelIsAtLeastInfo =
  LOG_LEVEL.toUpperCase() === 'INFO' || logLevelIsAtLeastDebug
const logLevelIsAtLeastWarn =
  LOG_LEVEL.toUpperCase() === 'WARN' || logLevelIsAtLeastInfo

const logStream = new ReplaySubject(10)

const print = (logFn, titleFn, messageFn, title, message, data, ...rest) => {
  if (data) {
    logFn(
      titleFn(title),
      messageFn(message),
      data instanceof Error ? data : JSON.stringify(data, null, 2),
      ...rest
    )
  } else {
    logFn(titleFn(title), messageFn(message), ...rest)
  }
}

module.exports = {
  logStream,
  debug: (message, data, ...rest) => {
    if (logLevelIsAtLeastDebug) {
      print(
        console.debug,
        chalk.whiteBright.bold,
        chalk.gray,
        'DEBUG',
        message,
        data,
        ...rest
      )
    }
  },
  error: (title, error, ...rest) => {
    print(
      console.error,
      chalk.redBright.bold,
      chalk.red,
      'ERROR',
      title,
      error,
      ...rest
    )
  },
  info: (message, data, ...rest) => {
    logStream.next(
      message + ' ' + [data, ...rest].map((x) => JSON.stringify(x)).join(' ')
    )

    if (logLevelIsAtLeastInfo) {
      print(
        console.log,
        chalk.whiteBright.bold,
        chalk.white,
        'INFO ',
        message,
        data,
        ...rest
      )
    }
  },
  warn: (message, data, ...rest) => {
    if (logLevelIsAtLeastWarn) {
      print(
        console.log,
        chalk.red.bold,
        chalk.white,
        'WARN ',
        message,
        data,
        ...rest
      )
    }
  },
  write: (data) => {
    if (logLevelIsAtLeastDebug) {
      process.stdout.write(data)
    }
  },
}
