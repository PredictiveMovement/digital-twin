const { interval, firstValueFrom } = require('rxjs')
const { scan, shareReplay, map, filter } = require('rxjs/operators')
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
    const startDate = addHours(startOfDay(new Date()), this.startHour)
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
    return this.currentTime
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

  async waitUntil(time) {
    if (this.timeMultiplier === 0) return // don't wait when time is stopped
    if (this.timeMultiplier === Infinity) return // return directly if time is set to infinity
    const waitUntil = time
    return firstValueFrom(this.currentTime.pipe(filter((e) => e >= waitUntil)))
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
