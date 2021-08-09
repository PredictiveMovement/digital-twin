const { from, Subject, ReplaySubject, forkJoin, timer } = require('rxjs')
const { take, scan, toArray, takeUntil, bufferTime, map, concatAll, windowTime, shareReplay } = require('rxjs/operators')
const { dispatch } = require('../../simulator/dispatchCentral')
const Car = require('../../lib/car')
const Booking = require('../../lib/booking')

describe("dispatch", () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  let cars
  let bookings

  beforeEach(() => {
    cars = from([new Car ({position: ljusdal}), new Car({position: arjeplog})]).pipe(shareReplay())
    bookings = from([new Booking({
      id: 0,
      pickup: {position: ljusdal},
      destination: {position: arjeplog}
    })])
  })

  it('should dispatch a booking to nearest car', function (done) {
    dispatch(cars, bookings).subscribe(({car, booking}) => {
      expect(car.position).toEqual(ljusdal)
      done()
    })
  })

  it('should dispatch two booking to each nearest car', function (done) {
    bookings = from([
      new Booking({
        id: 1337,
        pickup: {position: ljusdal},
        destination: {position: arjeplog}
      }),
      new Booking({
        id: 1338,
        pickup: {position: arjeplog},
        destination: {position: ljusdal}
      })
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
        asyncBookings.next(new Booking({
          id: 2,
          pickup: {position: arjeplog},
          destination: {position: ljusdal}
        }))
      } else {
        expect(id).toEqual(2)
        done()
      }
    })

    asyncBookings.next(new Booking({
      id: 1,
      pickup: {position: ljusdal},
      destination: {position: arjeplog}
    }))
  })

  it('should have cars available even the second time', function (done) {
    const asyncBookings = new Subject()
    const cars = new ReplaySubject()
    cars.next(new Car ({position: ljusdal}))
    cars.next(new Car ({position: arjeplog}))

    dispatch(cars, asyncBookings).subscribe(({booking: {id}, car: {position}}) => {
      if (id === 1) {
        expect(position).toEqual(ljusdal)
        asyncBookings.next(new Booking({
          id: 2,
          pickup: {position: arjeplog},
          destination: {position: ljusdal}
        }))
      } else {
        expect(position).toEqual(arjeplog)
        expect(id).toEqual(2)
        done()
      }
    })

    asyncBookings.next(
      new Booking({
        id: 1,
        pickup: {position: ljusdal},
        destination: {position: arjeplog}
      })
    )
  })


  it.only('should dispatch two booking to one car', function (done) {
    cars = from([new Car ({id: 1, position: ljusdal, timeMultiplier: Infinity})])
    bookings = from([
      new Booking({
        id: 1337,
        pickup: {position: ljusdal},
        destination: {position: arjeplog}
      }),
      new Booking({
        id: 1338,
        pickup: {position: arjeplog},
        destination: {position: ljusdal}
      })
    ])
    dispatch(cars, bookings).pipe(toArray()).subscribe(([assignment1, assignment2]) => {
      expect(assignment1.car.id).toEqual(1)
      expect(assignment1.booking.id).toEqual(1337)
      expect(assignment2.car.id).toEqual(1)
      expect(assignment2.booking.id).toEqual(1338)
      assignment1.booking.once('delivered', (booking) => {
        expect(booking.id).toEqual(1337)
      })
      assignment2.booking.once('delivered', (booking) => {
        expect(booking.id).toEqual(1338)
        done()
      })
    })
  })
  
})
