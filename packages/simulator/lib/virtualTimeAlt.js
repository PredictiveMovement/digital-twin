const { throws } = require('assert')
const EventEmitter = require('events')

class VirtualTimeAlt extends EventEmitter {

  constructor(startDate, timeMultiplier = 60) {
    super()
    this.startDate = startDate
    this.timeMultiplier = timeMultiplier
    this.reset()
  }

  reset() {
    this.trackDate = Date.now()
    this.currentTime = this.startDate
  }

  setTime(newTime) {
    console.log('setTime() to', new Date(newTime))
    if (!this.isPaused()) {
      this.trackDate = Date.now()
    }
    this.currentTime = newTime
  }

  time() {
    if (this.isPaused()) {
      return this.currentTime
    } else {
      var diff = Date.now() - this.trackDate
      diff = diff * this.timeMultiplier
      return this.currentTime + diff
    }
  }

  pause() {
    this.currentTime = this.time()
    this.trackDate = null
    console.log('pause() at', new Date(this.currentTime))
    this.emit('pause')
  }

  isPaused() {
    if (this.trackDate == null) {
      return true
    } else {
      return false
    }
  }

  play() {
    console.log('play() from', new Date(this.currentTime))
    this.trackDate = Date.now()
    this.emit('play')
  }

  setTimeMultiplier(timeMultiplier) {
    console.log('setTimeMultiplier() to', timeMultiplier)
    this.currentTime = this.time()
    this.timeMultiplier = timeMultiplier
    if (!this.isPaused()) {
      this.trackDate = Date.now()
    }
  }
}


module.exports = {
  virtualTimeAlt: new VirtualTimeAlt(), // static global time
  VirtualTimeAlt
}