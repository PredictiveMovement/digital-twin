const { throws } = require('assert')
const EventEmitter = require('events')


class VirtualTime extends EventEmitter {

  constructor(timeMultiplier = 60) {
    super()
    this.timeMultiplier = timeMultiplier
    this.startDate = Date.now()
    this.offset = 0
  }

  time () {
    const diff = Date.now() - this.startDate
    return Date.now() + this.offset + diff * this.timeMultiplier
  }

  play() {
    console.log('Play', new Date(this.time()))
    this.setTimeMultiplier(this.oldVirtualTime)
    this.offset = Date.now() - this.startDate
    this.emit('play')
  }

  pause() {
    console.log('Pause', new Date(this.time()))
    this.oldVirtualTime = this.timeMultiplier
    this.startDate = Date.now()
    this.setTimeMultiplier(0) // we let time pass but compensate for each second with one minus second
    this.emit('pause')
  }
  
  setTimeMultiplier(timeMultiplier) {
    this.startDate = Date.now()
    this.timeMultiplier = timeMultiplier
  }
  
}



module.exports = { 
  virtualTime: new VirtualTime() // static global time
}