const { from, Subject } = require('rxjs')
const { take, toArray } = require('rxjs/operators')
const { generateCars } = require('../../simulator/cars')
const { dispatch } = require('../../simulator/dispatchCentral')
const Car = require('../../lib/car')

describe("dispatch", () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  let cars
  let bookings

  beforeEach(() => {
    cars = from([new Car ({position: ljusdal}), new Car({position: arjeplog})])
    bookings = from([{
      id: 0,
      pickup: {position: ljusdal},
      destination: {position: arjeplog}
    }])
  })

  it('should dispatch a booking to nearest car', function (done) {
    dispatch(cars, bookings).subscribe(({car, booking}) => {
      expect(car.position).toEqual(ljusdal)
      done()
    })
  })

  it('should dispatch two booking to each nearest car', function (done) {
    bookings = from([
      {
        pickup: {position: ljusdal},
        destination: {position: arjeplog}
      },
      {
        pickup: {position: arjeplog},
        destination: {position: ljusdal}
      }
    ])
    dispatch(cars, bookings).pipe(toArray()).subscribe(([assignment1, assignment2]) => {
      expect(assignment1.car.position).toEqual(ljusdal)
      expect(assignment2.car.position).toEqual(arjeplog)
      done()
    })
  })

  it('should dispatch two bookings even when they arrive async', function (done) {
    const asyncBookings = new Subject()
    dispatch(cars, asyncBookings).subscribe(({booking: {id}, car}) => {
      if (id === 1) {
        expect(car.position).toEqual(ljusdal)
        asyncBookings.next(
          {
            id: 2,
            pickup: {position: arjeplog},
            destination: {position: ljusdal}
          }
        )
      } else {
        expect(id).toEqual(2)
        done()
      }
    })

    asyncBookings.next(
      {
        id: 1,
        pickup: {position: ljusdal},
        destination: {position: arjeplog}
      }
    )
  })
})
