var Heap = require('heap')

const comparator = (a, b) => a.time - b.time
let heap = new Heap(comparator)

schedule = (time, action) => {
  heap.push({time, action})
}

run_next = () => {
  const event = heap.pop()
  if (event) {
    const now = event.time
    event.action(now)
  } else {
    //throw new Error('End of time, no more events')
    process.exit(0)
  }
}

module.exports = { schedule, run_next }
