const moment = require('moment')
const { take, interval, toArray, tap, firstValueFrom } = require('rxjs')
const { scan, share, shareReplay, map } = require('rxjs/operators')
const {
  addMilliseconds,
  startOfDay,
  addHours,
  getUnixTime,
} = require('date-fns')

class VirtualTime {
  constructor(timeMultiplier = 1, startHour = 4.8) {
    this.startHour = startHour
    this.timeMultiplier = timeMultiplier
    this.startHour = startHour
    this.reset()
  }

  reset() {
    const startDate = addHours(startOfDay(new Date()), 2)
    const msUpdateFrequency = 100
    this.currentTime = interval(msUpdateFrequency).pipe(
      scan(
        (acc, _curr) =>
          addMilliseconds(acc, msUpdateFrequency * this.timeMultiplier),
        startDate
      ),
      shareReplay(1)
    )
  }

  getTimeStream() {
    return this.currentTime()
  }

  getTimeInMilliseconds() {
    return this.currentTime.pipe(
      map(getUnixTime),
      map((e) => e * 1000)
    )
  }

  getTimeInMillisecondsAsPromise() {
    return firstValueFrom(this.getTimeInMilliseconds())
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
      return setInterval(async () => {
        if ((await this.getTimeInMillisecondsAsPromise()) >= waitUntil)
          return resolve()
      }, checkInterval)
    })
  }

  // Set the speed in which time should advance
  setTimeMultiplier(timeMultiplier) {
    this.timeMultiplier = timeMultiplier - 1 // it makes more sense to have 1 mean realtime and 0 means stop the time.
  }
}

module.exports = {
  virtualTime: new VirtualTime(), // static global time
  VirtualTime,
}
