const moment = require('moment')

class VirtualTime {
  constructor(timeMultiplier = 1, startHour = 4) {
    this.startHour = startHour
    this.setTimeMultiplier(timeMultiplier)
    this.reset()
  }

  reset() {
    this.startDate = Date.now()
    this.offset = moment().startOf('day').add(this.startHour, 'hours').diff()
  }

  time() {
    const diff = Date.now() - this.startDate
    return Date.now() + this.offset + diff * this.timeMultiplier
  }

  play() {
    this.setTimeMultiplier(this.oldTimeMultiplier + 1)
  }

  pause() {
    this.oldTimeMultiplier = this.timeMultiplier
    this.setTimeMultiplier(0)
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

  addMinutes(minutes) {
    return this.time() + minutes * 60 * 1000
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
