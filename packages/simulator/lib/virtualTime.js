const { interval, firstValueFrom } = require('rxjs')
const {
  scan,
  shareReplay,
  map,
  filter,
  distinctUntilChanged,
} = require('rxjs/operators')
const {
  addMilliseconds,
  startOfDay,
  addHours,
  getUnixTime,
} = require('date-fns')

class VirtualTime {
  constructor(timeMultiplier = 1, startHour = 6.8) {
    this.startHour = startHour
    this.timeMultiplier = timeMultiplier
    this.startHour = startHour
    this.internalTimeScale = 1
    this.reset()
  }

  reset() {
    const startDate = addHours(startOfDay(new Date()), this.startHour)
    const msUpdateFrequency = 100
    this.currentTime = interval(msUpdateFrequency).pipe(
      scan(
        (acc) =>
          addMilliseconds(
            acc,
            msUpdateFrequency * this.timeMultiplier * this.internalTimeScale
          ),
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
      map((e) => e * 1000),
      distinctUntilChanged()
    )
  }

  getTimeInMillisecondsAsPromise() {
    return firstValueFrom(this.getTimeInMilliseconds())
  }

  play() {
    this.internalTimeScale = 1
  }

  pause() {
    this.internalTimeScale = 0
  }

  async waitUntil(time) {
    if (this.timeMultiplier === 0) return // don't wait when time is stopped
    if (this.timeMultiplier === Infinity) return // return directly if time is set to infinity
    const waitUntil = time
    return firstValueFrom(this.currentTime.pipe(filter((e) => e >= waitUntil)))
  }

  async wait(ms) {
    const now = await this.getTimeInMillisecondsAsPromise()
    return this.waitUntil(now + ms)
  }

  // Set the speed in which time should advance
  setTimeMultiplier(timeMultiplier) {
    this.timeMultiplier = timeMultiplier
  }
}

module.exports = {
  VirtualTime,
  virtualTime: new VirtualTime(), // Export an instance directly
}
