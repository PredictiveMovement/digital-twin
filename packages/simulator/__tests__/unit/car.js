const Car = require('../../lib/vehicles/car')
const { take, toArray, filter } = require('rxjs/operators')
const Booking = require('../../lib/models/booking')
const { virtualTime } = require('../../lib/virtualTime')

const range = (length) => Array.from({ length }).map((_, i) => i)

const once = (eventsStream, status, fn) =>
  eventsStream
    .pipe(
      filter((car) => car.status === status),
      take(1)
    )
    .subscribe(fn)

describe('A car', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  let car

  beforeEach(() => {
    virtualTime.setTimeMultiplier(Infinity)
  })

  it('should initialize correctly', function (done) {
    car = new Car()
    expect(car.id).toHaveLength(11)
    done()
  })

  it('should have initial position', function (done) {
    car = new Car({ id: 1, position: arjeplog })
    expect(car.position).toEqual(arjeplog)
    done()
  })

  it('should be able to teleport', function (done) {
    car = new Car({ id: 1, position: arjeplog })
    car.navigateTo(ljusdal)
    car.statusEvents.pipe(filter((car) => !car.moving)).subscribe((car) => {
      expect(car.position.lon).toEqual(ljusdal.lon)
      expect(car.position.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and navigate to pickup', function (done) {
    car = new Car({ id: 1, position: arjeplog })
    car.handleBooking(
      new Booking({
        id: 1,
        pickup: {
          position: ljusdal,
        },
      })
    )
    once(car.statusEvents, 'AtPickup', (car) => {
      expect(car.position.lon).toEqual(ljusdal.lon)
      expect(car.position.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and emit correct events', function (done) {
    car = new Car({ id: 1, position: arjeplog })
    car.handleBooking(
      new Booking({
        id: 1,
        pickup: {
          position: ljusdal,
        },
        destination: {
          position: arjeplog,
        },
      })
    )
    expect(car.status).toEqual('Pickup')
    once(car.statusEvents, 'AtPickup', () => {
      expect(car.position.lon).toEqual(ljusdal.lon)
      expect(car.position.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to pickup a booking and deliver it to its destination', function (done) {
    car = new Car({ id: 1, position: arjeplog })
    car.handleBooking(
      new Booking({
        id: 1,
        pickup: {
          position: ljusdal,
        },
        destination: {
          position: arjeplog,
        },
      })
    )
    car.statusEvents.subscribe((car) => console.log(car.status))

    once(car.statusEvents, 'AtPickup', () => {
      expect(car.position.lon).toEqual(ljusdal.lon)
      expect(car.position.lat).toEqual(ljusdal.lat)
    })

    once(car.statusEvents, 'AtDropoff', () => {
      expect(car.position.lon).toEqual(arjeplog.lon)
      expect(car.position.lat).toEqual(arjeplog.lat)
      done()
    })
  })

  it('should be able to pickup multiple bookings and queue the all except the first', function () {
    car = new Car({ id: 1, position: arjeplog })
    car.handleBooking(
      new Booking({
        id: 1,
        pickup: {
          position: ljusdal,
        },
        destination: {
          position: arjeplog,
        },
      })
    )

    const bookings = range(10).map((id) =>
      car.handleBooking(new Booking({ id }))
    )

    expect(car.queue).toHaveLength(10)
  })

  it('should be able to handle the bookings from the same place in the queue', function (done) {
    car = new Car({ id: 1, position: arjeplog })
    expect(car.queue).toHaveLength(0)
    const ljusdalToArjeplog = {
      pickup: {
        position: ljusdal,
      },
      destination: {
        position: arjeplog,
      },
    }

    const arjeplogToLjusdal = {
      pickup: {
        position: arjeplog,
      },
      destination: {
        position: ljusdal,
      },
    }

    car.handleBooking(
      new Booking({
        id: 1,
        ...ljusdalToArjeplog,
      })
    )

    const last = new Booking({
      id: 2,
      ...arjeplogToLjusdal,
    })
    car.handleBooking(last)

    const bookings = range(10).map((id) =>
      car.handleBooking(new Booking({ id, ...ljusdalToArjeplog }))
    )

    const [firstBooking, secondBooking, thirdBooking, ...rest] = bookings

    once(firstBooking.deliveredEvents, 'Delivered', () => {
      expect(car.queue).toHaveLength(1)
    })

    once(secondBooking.deliveredEvents, 'Delivered', () => {
      expect(car.queue).toHaveLength(1)
    })

    once(last.deliveredEvents, 'Delivered', () => {
      expect(car.queue).toHaveLength(0)
      done()
    })

    expect(car.queue).toHaveLength(11)
  })
})
