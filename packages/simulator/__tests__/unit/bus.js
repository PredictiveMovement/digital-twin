const Bus = require('../../lib/vehicles/bus')
const { take, toArray } = require('rxjs/operators')
const Booking = require('../../lib/booking')
const { virtualTime } = require('../../lib/virtualTime')
const { from, Subject } = require('rxjs')
const range = (length) => Array.from({ length }).map((_, i) => i)
const moment = require('moment')
describe('A bus', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  let bus

  it.only('should be able to pickup multiple bookings and queue the all except the first', () => {
    const stops = new Subject()
    bus = new Bus({ id: 1, position: arjeplog, stops })

    range(10).map((i) =>
      stops.next({
        pickup: ljusdal,
        destination: arjeplog,
        departureTime: moment('2021-04-20:00:00:00')
          .add(i, 'minutes')
          .format('HH:mm:ss'),
      })
    )

    const queue = bus.queue
    console.log(bus.queue.map((e) => e.pickup.departureTime))
    expect(queue.length).toBe(8)
    expect(queue[0].pickup).toEqual(ljusdal)
    expect(queue[0].departureTime).toBe('00:00:00')
    expect(queue[0].arrivalTime).toBe('00:00:00')
    expect(queue[0].status).toBe('queued')
  })
})
