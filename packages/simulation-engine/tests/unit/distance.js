/* eslint-env node, mocha */

const oboy = require('oboy')
const cars = [ {id: 1, position: {lon: 1, lat: 2}}, {id: 2, position: {lon: 2, lat: 3}} ]
const distance = require('../../lib/distance')

oboy((expect, sinon, proxyquire) => {
  it('should sort the cars in distance from a point', function (done) {
    const osrm = sinon.stub()
    distance.closestCars(cars, { lon: 3, lat: 3 })
      .map(hit => hit.car.id)
      .toArray(arr => expect(arr).to.eql([2, 1]) && done())
  })
})
