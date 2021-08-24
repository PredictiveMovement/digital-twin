const { VirtualTimeAlt } = require('../../lib/virtualTimeAlt')

var startDate = Date.now()
virtualTime = new VirtualTimeAlt(startDate, 1)

console.log("0", new Date(virtualTime.time()))
// 0: should toBeNear startDate

setTimeout(() => {
    console.log("1", new Date(virtualTime.time()))
    // 1: should toBeNear startDate + 5 seconds
    console.log(virtualTime.isPaused())
    virtualTime.pause()
}, 5 * 1000)

setTimeout(() => {
    console.log("2", new Date(virtualTime.time()))
    // 2: should toBeNear startDate + 5 seconds
    console.log(virtualTime.isPaused())
    virtualTime.play()
}, 10 * 1000)

setTimeout(() => {
    console.log("3", new Date(virtualTime.time()))
    // 3: should toBeNear startDate + 10 seconds
    virtualTime.setTime(1629840790000)
}, 15 * 1000)

setTimeout(() => {
    console.log("4", new Date(virtualTime.time()))
    // 4: should toBeNear 2021-08-24T21:33:10.000Z + 5 seconds
    virtualTime.setTimeMultiplier(2)
}, 20 * 1000)

setTimeout(() => {
    console.log("5", new Date(virtualTime.time()))
    // 5: should toBeNear 2021-08-24T21:33:10.000Z + 15 seconds
    virtualTime.setTimeMultiplier(-1) // going backwards
}, 25 * 1000)

setTimeout(() => {
    console.log("6", new Date(virtualTime.time()))
    // 6: should toBeNear 2021-08-24T21:33:10.000Z + 10 seconds
}, 30 * 1000)
