const { throws } = require('assert')
const EventEmitter = require('events')

class VirtualTime extends EventEmitter {

  constructor(timeMultiplier = 60) {
    super()
    this.startDate = Date.now()
    this.setTimeMultiplier(timeMultiplier)
  }

  time() {
    const diff = Date.now() - this.startDate
    return Date.now() + diff * this.timeMultiplier
  }

  play() {
    console.log('play old time mp', this.oldTimeMultiplier)
    this.setTimeMultiplier(this.oldTimeMultiplier + 1)
    this.emit('play')
  }

  pause() {
    console.log('pause()', this.timeMultiplier)
    this.oldTimeMultiplier = this.timeMultiplier
    this.setTimeMultiplier(0) // we let time pass but compensate for each second with one minus second
    this.emit('pause')
  }

  setTimeMultiplier(timeMultiplier) {
    console.log('set tmp', timeMultiplier)
    const diff = Date.now() - this.startDate
    this.startDate = Date.now()
    this.timeMultiplier = timeMultiplier - 1 // it makes more sense to have 1 mean realtime and 0 means stop the time.
  }

}



module.exports = {
  virtualTime: new VirtualTime(), // static global time
  VirtualTime
}