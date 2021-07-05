const { fromEvent, range } = require('rxjs')
const Car = require('../car')
const Pool = require('../pool')

const hub = { lat: 61.8271305, lon: 16.0988313 }
let id = 1
const CAR_COUNT = 1

function generateCar(pool) {
  const next_id = id++
  console.log(`[red] generateCar#${next_id}`)
  const car = new Car(`red-${next_id}`, hub, pool)
  return car
}

const pool = new Pool()

module.exports = {
  start: () => {
    range(1, CAR_COUNT)
      .forEach(() => pool.emit('join', generateCar(pool)))
  },
  join$: fromEvent(pool, 'join'),
  data$: fromEvent(pool, 'data')
}


