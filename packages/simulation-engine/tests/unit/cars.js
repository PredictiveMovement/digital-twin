/* eslint-env node, mocha */

const oboy = require('oboy')
const cars = require('../../simulator/cars')

oboy((expect, sinon, proxyquire) => {
  it('should randomize at least 15 cars with initial positions', function (done) {
    cars.fork().take(15).toArray(initialCars => {
      try {
        expect(initialCars).to.have.length(15)
        expect(initialCars[0]).to.have.property('position')
        expect(initialCars[0].position).to.have.property('lat')
        expect(initialCars[0].position.lat).to.be.above(58)
        expect(initialCars[0].position.lat).to.be.below(60)
        expect(initialCars[0].position.lon).to.be.above(17)
        expect(initialCars[0].position.lon).to.be.below(19)
        done()
      } catch (err) { done(err) }
    })
  })
})
