const { throws } = require('assert')
const EventEmitter = require('events')
const moment = require('moment')

class VirtualTime extends EventEmitter {
  constructor(timeMultiplier = 1, startHour = 5.3) {
    super()
    this.startDate = Date.now()
    this.setTimeMultiplier(timeMultiplier)
    this.offset = moment().startOf('day').add(startHour, 'hours').diff()
  }

  time() {
    const diff = Date.now() - this.startDate
    return Date.now() + this.offset + diff * this.timeMultiplier
  }

  play() {
    this.setTimeMultiplier(this.oldTimeMultiplier + 1)
    this.emit('play')
  }

  pause() {
    this.oldTimeMultiplier = this.timeMultiplier
    this.setTimeMultiplier(0)
    this.emit('pause')
  }

  async waitUntil(time, checkInterval = 100) {
    if (this.timeMultiplier === 0) return // don't wait when time is stopped
    if (this.timeMultiplier === Infinity) return // return directly if time is set to infinity
    const waitUntil = time
    return await new Promise((resolve) => {
      return setInterval(() => {
        if (this.time() >= waitUntil) return resolve()
      }, checkInterval)
    })
  }

  timeInSeconds(seconds) {
    return moment(this.time()).add(seconds, 'seconds')
  }

  // Set the speed in which time should advance
  setTimeMultiplier(timeMultiplier) {
    this.offset = this.time() - Date.now() // save the current offset before reseting the time multiplier
    this.startDate = Date.now()
    this.timeMultiplier = timeMultiplier - 1 // it makes more sense to have 1 mean realtime and 0 means stop the time.
  }
}

module.exports = {
  virtualTime: new VirtualTime(), // static global time
  VirtualTime,
}
