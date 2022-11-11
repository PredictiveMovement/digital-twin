const { from } = require('rxjs')

const { taxiDispatch } = require('../../lib/dispatch/taxiDispatch')
const Taxi = require('../../lib/vehicles/taxi')
const Booking = require('../../lib/models/booking')

describe('taxiDispatch', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  const arjeplogToLjusdal = {
    pickup: {
      position: arjeplog,
    },
    destination: {
      position: ljusdal,
    },
  }
  it('should dispatch a booking to nearest taxi', (done) => {
    const taxis = [
      new Taxi({ id: 1, position: ljusdal }),
      new Taxi({ id: 2, position: arjeplog }),
    ]
    const stops = [
      new Booking({
        id: 'b-1',
        ...arjeplogToLjusdal
      }),
    ]
    const assignments = taxiDispatch(taxis, stops)
    assignments.subscribe((assignment) => {
      expect(assignment.taxi.position).toEqual(ljusdal)
      expect(assignment.taxi.id).toEqual(1)
      done()
    })
  })

  it.skip('should dispatch a bus stop to nearest taxi', (done) => {
    // This test seems aspirational, but it's not how the system works today
    const taxis = [
      new Taxi({ id: 1, position: ljusdal }),
      new Taxi({ id: 2, position: arjeplog }),
    ]
    const stops = [
      {
        id: 'stop-1',
        position: ljusdal,
        arrivalTime: '09:00',
        departureTime: '09:01',
      },
    ]
    const assignments = taxiDispatch(taxis, stops)
    assignments.subscribe((assignment) => {
      expect(assignment.taxi.position).toEqual(ljusdal)
      expect(assignment.taxi.id).toEqual(1)
      done()
    })
  })
})
