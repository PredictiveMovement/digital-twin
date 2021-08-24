const { from, Subject, ReplaySubject, forkJoin, timer } = require('rxjs')
const { take, scan, toArray, takeUntil, bufferTime, map, concatAll, windowTime, shareReplay } = require('rxjs/operators')
const { dispatch } = require('../../simulator/dispatchCentral')
const Car = require('../../lib/car')
const Booking = require('../../lib/booking')

describe("dispatch", () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  const stockholm = { lon: 18.063240, lat: 59.334591 }
  let cars
  let bookings

  beforeEach(() => {
    cars = from([new Car ({position: ljusdal, timeMultiplier: Infinity}), new Car({position: arjeplog, timeMultiplier: Infinity})]).pipe(shareReplay())
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
    cars.next(new Car ({position: ljusdal, timeMultiplier: Infinity}))
    cars.next(new Car ({position: arjeplog, timeMultiplier: Infinity}))

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


  it('should dispatch two bookings to one car', function (done) {
    cars = from([new Car ({id: 1, position: ljusdal, timeMultiplier: Infinity})])
    bookings = from([
      new Booking({
        id: 1337,
        pickup: {position: ljusdal, name: 'pickup 1'},
        destination: {position: arjeplog, name: 'dropoff 1'}
      }),
      new Booking({
        id: 1338,
        pickup: {position: arjeplog, name: 'pickup 2'},
        destination: {position: ljusdal, name: 'dropoff 2'}
      })
    ])
    dispatch(cars, bookings).pipe(toArray()).subscribe(([assignment1, assignment2]) => {
      expect(assignment1.car.id).toEqual(1)
      expect(assignment1.booking.id).toEqual(1337)
      expect(assignment2.car.id).toEqual(1)
      expect(assignment2.booking.id).toEqual(1338)
      assignment1.booking.once('delivered', (booking) => {
        console.log('booking 1 delivered')
        expect(booking.id).toEqual(1337)
      })
      assignment2.booking.once('delivered', (booking) => {
        expect(booking.id).toEqual(1338)
        done()
      })
    })
  })

  it('should dispatch three bookings to one car with only capacity for one and still deliver them all', function (done) {
    cars = from([new Car ({id: 1, position: ljusdal, capacity: 1, timeMultiplier: Infinity})])
    bookings = from([
      new Booking({
        id: 1337,
        pickup: {position: ljusdal, name: 'pickup 1'},
        destination: {position: arjeplog, name: 'dropoff 1'}
      }),
      new Booking({
        id: 1338,
        pickup: {position: arjeplog, name: 'pickup 2'},
        destination: {position: stockholm, name: 'dropoff 2'}
      }),
      new Booking({
        id: 1339,
        pickup: {position: stockholm, name: 'pickup 3'},
        destination: {position: arjeplog, name: 'dropoff 3'}
      })
    ])
    dispatch(cars, bookings).pipe(toArray()).subscribe(([assignment1, assignment2, assignment3]) => {
      expect(assignment1.car.id).toEqual(1)
      expect(assignment1.booking.id).toEqual(1337)
      expect(assignment2.car.id).toEqual(1)
      expect(assignment2.booking.id).toEqual(1338)
      expect(assignment3.car.id).toEqual(1)
      expect(assignment3.booking.id).toEqual(1339)
      assignment1.booking.once('delivered', (booking) => {
        console.log('booking 1 delivered')
        expect(booking.id).toEqual(1337)
        expect(assignment1.car.queue).toHaveLength(2)
      })
      assignment2.booking.once('delivered', (booking) => {
        console.log('booking 2 delivered')
        expect(booking.id).toEqual(1338)
        expect(assignment2.car.queue).toHaveLength(1)
      })
      assignment3.booking.once('delivered', (booking) => {
        expect(booking.id).toEqual(1339)
        done()
      })
    })
  })
  
})
