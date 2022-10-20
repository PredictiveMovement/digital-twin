const moment = require('moment')
const { take, interval, toArray, firstValueFrom } = require('rxjs')
const { scan, share, shareReplay, map } = require('rxjs/operators')
const { addSeconds, format, getMilliseconds } = require('date-fns')

class VirtualTime {
  constructor(timeMultiplier = 1, startHour = 2) {
    this.startHour = startHour
    this.setTimeMultiplier(timeMultiplier)
    this.reset()

    const startDate = new Date(2022, 9, 20, startHour + 2)
    this.currentTime = interval(100).pipe(
      scan((acc, _curr) => addSeconds(acc, 1 * this.timeMultiplier), startDate),
      map(getMilliseconds),
      shareReplay(1)
    )

    this.currentTime.subscribe(() => null)
  }

  reset() {
    this.startDate = Date.now()
    this.offset = moment().startOf('day').add(this.startHour, 'hours').diff()
  }

  time() {
    return firstValueFrom(this.currentTime)
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

  timeInSeconds(seconds) {
    return moment(this.time()).add(seconds, 'seconds')
  }

  // Set the speed in which time should advance
  setTimeMultiplier(timeMultiplier) {
    // this.offset = this.time() - Date.now() // save the current offset before reseting the time multiplier
    // this.startDate = Date.now()
    this.timeMultiplier = timeMultiplier - 1 // it makes more sense to have 1 mean realtime and 0 means stop the time.
  }
}

module.exports = {
  virtualTime: new VirtualTime(), // static global time
  VirtualTime,
}
