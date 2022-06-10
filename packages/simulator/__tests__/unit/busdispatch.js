const { busDispatch } = require('./lib/busDispatch')

describe('busDispatch', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }

  it('should dispatch a booking to nearest car', (done) => {
    const cars = from([
      new Car({ id: 1, position: ljusdal }),
      new Car({ id: 2, position: arjeplog }),
    ])
    const stops = from([
      {
        id,
        name,
        position: ljusdal,
        station: parent_station,
        platform: platform_code,
        tripId: 1,
        position: ljusdal,
        arrivalTime: '09:00',
        departureTime: '09:01',
      },
    ])
    const assignments = busDispatch(cars, bookings)
    assignments.subscribe((assignment) => {
      expect(assignment.car.position).toEqual(ljusdal)
      expect(assignment.car.id).toEqual(1)
      done()
    })
  })
})
