const Car = require('../../lib/car')
const { take, toArray } = require('rxjs/operators')

describe("A car", () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  it('should initialize correctly', function (done) {
    const car = new Car()
    expect(car.id).toHaveLength(9)
    done()
  })

  it('should have initial position', function (done) {
    const car = new Car({id: 1, position: arjeplog})
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
})
