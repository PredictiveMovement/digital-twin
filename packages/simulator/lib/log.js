const chalk = require('chalk')

module.exports = {
  error: (title, error, data) => {
    console.error(`${chalk.redBright.bold('ERROR')} ${chalk.red(title)}`)
    console.error(error)
    if (data) {
      console.error(JSON.stringify(data, null, 2))
    }
  },
  info: (message, data = '') => {
    console.log(
      `${chalk.whiteBright.bold('INFO')} ${chalk.white(message)}`,
      data
    )
  },
}
