const { from } = require('rxjs')

const { taxiDispatch } = require('../../lib/dispatch/taxiDispatch')
const Taxi = require('../../lib/vehicles/taxi')

describe('taxiDispatch', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }

  it('should dispatch a booking to nearest taxi', (done) => {
    const taxis = from([
      new Taxi({ id: 1, position: ljusdal }),
      new Taxi({ id: 2, position: arjeplog }),
    ])
    const stops = from([
      {
        id: 'stop-1',
        position: ljusdal,
        arrivalTime: '09:00',
        departureTime: '09:01',
      },
    ])
    const assignments = taxiDispatch(taxis, stops)
    assignments.subscribe((assignment) => {
      expect(assignment.taxi.position).toEqual(ljusdal)
      expect(assignment.taxi.id).toEqual(1)
      done()
    })
  })
})
