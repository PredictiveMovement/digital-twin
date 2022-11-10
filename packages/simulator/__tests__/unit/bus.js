const moment = require('moment')
const { Subject } = require('rxjs')

const Bus = require('../../lib/vehicles/bus')

const range = (length) => Array.from({ length }).map((_, i) => i)

describe('A bus', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }

  it('should be able to pickup multiple bookings and queue the all except the first',  (done) => {
    const stops = new Subject()
    const bus = new Bus({ id: 1, position: arjeplog, stops })

    range(10).map((i) =>
      stops.next({
        position: i % 2 === 0 ? ljusdal : arjeplog,
        stopName: i % 2 === 0 ? 'ljusdal' : 'arjeplog',
        departureTime: moment('2021-04-20 00:00:00')
          .add(i, 'minutes')
          .format('HH:mm:ss'),
      })
    )

    const queue = bus.queue
    expect(queue.length).toBe(8)
    expect(queue[0].pickup.position).toEqual(arjeplog)
    expect(queue[0].pickup.stopName).toBe('arjeplog')
    expect(queue[0].pickup.departureTime).toBe('00:01:00')
    expect(queue[0].destination.position).toEqual(ljusdal)
    expect(queue[0].destination.stopName).toBe('ljusdal')
    expect(queue[0].destination.departureTime).toBe('00:02:00')
    expect(queue[0].status).toBe('Queued')
    bus.unsubscribe()
    done()
  })
})
