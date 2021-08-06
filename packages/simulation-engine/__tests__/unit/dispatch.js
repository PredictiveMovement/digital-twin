const { from, Subject, ReplaySubject, forkJoin, timer } = require('rxjs')
const { take, scan, toArray, takeUntil, bufferTime, map, concatAll, windowTime } = require('rxjs/operators')
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

  it('should understand rxjs shareReplay', (done) => {
    const cars = new ReplaySubject()
    cars.next(1)
    cars.next(2)

    cars.pipe(takeUntil(timer(500)), toArray()).subscribe(([car1, car2]) => {
      expect(car1).toEqual(1)
      expect(car2).toEqual(2)

      // try it again to make sure we can read it twice
      cars.pipe(takeUntil(timer(500)), toArray()).subscribe(([car1, car2]) => {
        expect(car1).toEqual(1)
        expect(car2).toEqual(2)
        done()
      })
    })
  })

  it('should have cars available even the second time', function (done) {
    const asyncBookings = new Subject()
    const cars = new ReplaySubject()
    cars.next(new Car ({position: ljusdal}))
    cars.next(new Car ({position: arjeplog}))

    dispatch(cars, asyncBookings).subscribe(({booking: {id}, car: {position}}) => {
      if (id === 1) {
        expect(position).toEqual(ljusdal)
        asyncBookings.next(
          {
            id: 2,
            pickup: {position: arjeplog},
            destination: {position: ljusdal}
          }
        )
      } else {
        expect(position).toEqual(arjeplog)
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
