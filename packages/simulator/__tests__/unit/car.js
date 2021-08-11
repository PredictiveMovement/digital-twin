const Car = require('../../lib/car')
const { take, toArray } = require('rxjs/operators')
const Booking = require('../../lib/booking')

describe("A car", () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }

  it('should initialize correctly', function (done) {
    const car = new Car({timeMultiplier: Infinity})
    expect(car.id).toHaveLength(9)
    done()
  })

  it('should have initial position', function (done) {
    const car = new Car({id: 1, position: arjeplog, timeMultiplier: Infinity})
    expect(car.position).toEqual(arjeplog)
    done()
  })

  it('should be able to teleport', function (done) {
    const car = new Car({id: 1, position: arjeplog, timeMultiplier: Infinity})
    car.navigateTo(ljusdal)
    car.on('stopped', () => {
      expect(car.position?.lon).toEqual(ljusdal.lon)
      expect(car.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and navigate to pickup', function (done) {
    const car = new Car({id: 1, position: arjeplog, timeMultiplier: Infinity})
    car.handleBooking(new Booking({
      id: 1,
      pickup: {
        position: ljusdal
      }
    }))
    car.once('pickup', () => {
      expect(car.position?.lon).toEqual(ljusdal.lon)
      expect(car.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to handle one booking and emit correct events', function (done) {
    const car = new Car({id: 1, position: arjeplog, timeMultiplier: Infinity}) 
    car.handleBooking(new Booking({
      id: 1,
      pickup: {
        position: ljusdal
      },
      destination: {
        position: arjeplog
      }
    }))
    expect(car.status).toEqual('Pickup')
    car.on('pickup', () => {
      expect(car.position?.lon).toEqual(ljusdal.lon)
      expect(car.position?.lat).toEqual(ljusdal.lat)
      done()
    })
  })

  it('should be able to pickup a booking and deliver it to its destination', function (done) {
    const car = new Car({id: 1, position: arjeplog, timeMultiplier: Infinity})
    car.handleBooking(new Booking({
      id: 1,
      pickup: {
        position: ljusdal
      },
      destination: {
        position: arjeplog
      }
    }))
    car.once('pickup', () => {
      expect(car.position?.lon).toEqual(ljusdal.lon)
      expect(car.position?.lat).toEqual(ljusdal.lat)
    })

    car.once('dropoff', () => {
      expect(car.position?.lon).toEqual(arjeplog.lon)
      expect(car.position?.lat).toEqual(arjeplog.lat)
      done()
    })
  })



})
