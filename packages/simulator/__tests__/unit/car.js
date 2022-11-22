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
  const arjeplog = { position: { lon: 17.886855, lat: 66.041054 } }
  const ljusdal = { position: { lon: 14.44681991219, lat: 61.59465992477 } }

  const ljusdalToArjeplog = {
    pickup: ljusdal,
    destination: arjeplog,
  }

  const arjeplogToLjusdal = {
    pickup: arjeplog,
    destination: ljusdal,
  }

  const positionName = ({ lon, lat }) => {
    switch (`${lon} ${lat}`) {
      case `${ljusdal.position.lon} ${ljusdal.position.lat}`:
        return 'Ljusdal'
      case `${arjeplog.position.lon} ${arjeplog.position.lat}`:
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
    const car = new Car({ id: 1, position: arjeplog.position })
    expect(car.position).toEqual(arjeplog.position)
    done()
  })

  it('should be able to teleport', function (done) {
    const car = new Car({ id: 1, position: arjeplog.position })
    car.navigateTo(ljusdal)
    car.statusEvents.pipe(filter((car) => !car.moving)).subscribe((car) => {
      expect(car.position.lon).toEqual(ljusdal.position.lon)
      expect(car.position.lat).toEqual(ljusdal.position.lat)
      done()
    })
  })

  it('should be able to handle one booking and navigate to pickup', function (done) {
    const car = new Car({ id: 1, position: arjeplog.position })
    car.handleBooking(
      new Booking({
        id: 1,
        ...ljusdalToArjeplog,
      })
    )
    once(car.statusEvents, 'AtPickup', (car) => {
      expect(car.position.lon).toEqual(ljusdal.position.lon)
      expect(car.position.lat).toEqual(ljusdal.position.lat)
      done()
    })
  })

  it('should be able to handle one booking and emit correct events', function (done) {
    const car = new Car({ id: 1, position: arjeplog.position })
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
      expect(car.position.lon).toEqual(ljusdal.position.lon)
      expect(car.position.lat).toEqual(ljusdal.position.lat)
      done()
    })
  })

  it('should be able to pickup a booking and deliver it to its destination', function (done) {
    const car = new Car({ id: 1, position: arjeplog.position })
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
      expect(car.position.lon).toEqual(ljusdal.position.lon)
      expect(car.position.lat).toEqual(ljusdal.position.lat)
    })

    once(car.statusEvents, 'AtDropOff', () => {
      expect(car.position.lon).toEqual(arjeplog.position.lon)
      expect(car.position.lat).toEqual(arjeplog.position.lat)
      done()
    })
  })

  it('should be able to pickup multiple bookings and queue the all except the first', function () {
    const car = new Car({ id: 1, position: arjeplog.position })
    car.handleBooking(
      new Booking({
        id: 1,
        ...ljusdalToArjeplog
      })
    )

    range(10).map((id) =>
      car.handleBooking(new Booking({ id, ...arjeplogToLjusdal }))
    )

    expect(car.queue).toHaveLength(10)
  })

  it('should be able to handle the bookings from the same place in the queue', async () => {
    const car = new Car({ id: 'v-1', position: arjeplog.position })
    // börja i Arjeplog

    expect(car.queue).toHaveLength(0)

    // åk till Ljusdal och hämta paket som ska tillbaka till arjeplog
    car.handleBooking(
      new Booking({
        id: 'b-1',
        ...ljusdalToArjeplog,
      })
    )

    // men ta med dig ett paket när du ändå åker till Ljusdal
    car.handleBooking(
      new Booking({
        id: 'b-2',
        ...arjeplogToLjusdal,
      })
    )

    // sen har vi flera paket som ska till till Arjeplog
    range(10).map((id) =>
      car.handleBooking(new Booking({ id: `b-${id+2}`, ...ljusdalToArjeplog }))
    )

    const log = await car.statusEvents
    .pipe(
      map(
        ({ status, position, id }) =>
          `${status}:${positionName(position)}:${id}`
      ),
      take(7),
      toArray()
    ).toPromise()

    expect(log).toEqual([ // TODO: vilken ordning är mest logisk?
      'Pickup:Arjeplog:v-1',
      'Pickup:Ljusdal:v-1',
      'AtPickup:Ljusdal:v-1',
      'Delivery:Ljusdal:v-1',
      'Delivery:Arjeplog:v-1',
      'AtDropOff:Arjeplog:v-1',
      'AtDropOff:Arjeplog:v-1',

    ])

    expect(car.queue).toHaveLength(11)
  })
})
