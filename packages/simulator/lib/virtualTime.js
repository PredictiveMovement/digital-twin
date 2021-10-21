const { throws } = require('assert')
const EventEmitter = require('events')
const moment = require('moment')

class VirtualTime extends EventEmitter {

  constructor(timeMultiplier = 60, startHour = 5.3) {
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

  // Set the speed in which time should advance
  setTimeMultiplier(timeMultiplier) {
    this.offset = this.time() - Date.now() // save the current offset before reseting the time multiplier
    this.startDate = Date.now()
    this.timeMultiplier = timeMultiplier - 1 // it makes more sense to have 1 mean realtime and 0 means stop the time.
  }

}



module.exports = {
  virtualTime: new VirtualTime(), // static global time
  VirtualTime
}