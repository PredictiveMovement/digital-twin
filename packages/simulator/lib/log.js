const chalk = require('chalk')

module.exports = {
  error: (title, error) => {
    console.log(
      `${chalk.gray(' ***')} ${chalk.redBright.bold('ERROR')} ${chalk.red.bold(
        JSON.stringify(title).slice(0, 200)
      )} ${chalk.redBright(error)}`
    )
  },
  info: (message, data = '') => {
    // console.log(`${chalk.gray(' ***')} ${chalk.whiteBright.bold('INFO')} ${chalk.white(message)}`, data)
  },
}
