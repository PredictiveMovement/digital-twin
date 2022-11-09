const Car = require('../../lib/vehicles/car')
const { take, toArray, filter, map } = require('rxjs/operators')
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

  const positionName = ({ lon, lat }) => {
    switch (`${lon} ${lat}`) {
      case `${ljusdal.lon} ${ljusdal.lat}`:
        return 'Ljusdal'
      case `${arjeplog.lon} ${arjeplog.lat}`:
        return 'Arjeplog'
      default:
        return 'Unknown'
    }
  }

  beforeEach(() => {
    virtualTime.setTimeMultiplier(Infinity)
  })

  it('should initialize correctly', function (done) {
    const car = new Car()
    expect(car.id).toHaveLength(11)
    done()
  })

  it('should have initial position', function (done) {
    const car = new Car({ id: 1, position: arjeplog })
    expect(car.position).toEqual(arjeplog)
    done()
  })

  it('should be able to teleport', function (done) {
    const car = new Car({ id: 1, position: arjeplog })
    car.navigateTo(ljusdal)
    car.statusEvents.pipe(filter((car) => !car.moving)).subscribe((car) => {
      expect(car.position.lon).toEqual(ljusdal.lon)
      expect(car.position.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and navigate to pickup', function (done) {
    const car = new Car({ id: 1, position: arjeplog })
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
    const car = new Car({ id: 1, position: arjeplog })
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
    const car = new Car({ id: 1, position: arjeplog })
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

    once(car.statusEvents, 'AtPickup', () => {
      expect(car.position.lon).toEqual(ljusdal.lon)
      expect(car.position.lat).toEqual(ljusdal.lat)
    })

    once(car.statusEvents, 'AtDropOff', () => {
      expect(car.position.lon).toEqual(arjeplog.lon)
      expect(car.position.lat).toEqual(arjeplog.lat)
      done()
    })
  })

  it('should be able to pickup multiple bookings and queue the all except the first', function () {
    const car = new Car({ id: 1, position: arjeplog })
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

  it('should be able to handle the bookings from the same place in the queue', async () => {
    const car = new Car({ id: 'v-1', position: arjeplog })
    // börja i Arjeplog

    expect(car.queue).toHaveLength(0)

    // åk till Ljusdal och hämta paket som ska tillbaka till arjeplog
    car.handleBooking(
      new Booking({
        id: 1,
        ...ljusdalToArjeplog,
      })
    )

    // men ta med dig ett paket när du ändå åker till Ljusdal
    car.handleBooking(
      new Booking({
        id: 2,
        ...arjeplogToLjusdal,
      })
    )

    // sen har vi flera paket som ska till till Arjeplog
    range(10).map((id) =>
      car.handleBooking(new Booking({ id, ...ljusdalToArjeplog }))
    )

    const log = await car.statusEvents
      .pipe(
        map(
          ({ status, position, queue }) =>
            `${status}:${positionName(position)}:${queue.length}`
        ),
        take(15),
        toArray()
      )
      .toPromise()

    expect(log).toEqual([
      'Pickup:Arjeplog:11',
      'Pickup:Ljusdal:11', // TODO: vilken ordning är mest logisk?
      'AtPickup:Ljusdal:1',
      'DropOff:Arjeplog:1',
      'AtDropOff:Arjeplog:1',
      'Pickup:Arjeplog:11',
    ])

    expect(car.queue).toHaveLength(11)
  })
})
