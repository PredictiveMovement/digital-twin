const chalk = require('chalk')

module.exports = {
  error: message => {
    console.log(`${chalk.gray(' ***')} ${chalk.redBright.bold('INFO')} ${chalk.red(message)}`)
  },
  info: message => {
    console.log(`${chalk.gray(' ***')} ${chalk.whiteBright.bold('INFO')} ${chalk.white(message)}`)
  },
}