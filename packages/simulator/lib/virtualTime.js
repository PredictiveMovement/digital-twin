const { throws } = require('assert')
const EventEmitter = require('events')


class VirtualTime extends EventEmitter {

  constructor(timeMultiplier = 60) {
    super()
    this.setTimeMultiplier(timeMultiplier)
  }

  time() {
    const diff = Date.now() - this.startDate
    return Date.now() + diff * this.timeMultiplier
  }

  play() {
    this.setTimeMultiplier(this.oldTimeMultiplier)
    this.emit('play')
  }

  pause() {
    this.oldTimeMultiplier = this.timeMultiplier
    this.startDate = Date.now()
    this.setTimeMultiplier(0) // we let time pass but compensate for each second with one minus second
    this.emit('pause')
  }

  setTimeMultiplier(timeMultiplier) {
    this.startDate = Date.now()
    this.timeMultiplier = timeMultiplier - 1 // it makes more sense to have 1 mean realtime and 0 means stop the time.
  }

}



module.exports = {
  virtualTime: new VirtualTime(), // static global time
  VirtualTime
}