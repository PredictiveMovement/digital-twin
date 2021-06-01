/* eslint-env node, mocha */

const oboy = require('oboy')
const _ = require('highland')

const closestCars = [
  { id: 1, position: { lat: 59.36861599375561, lon: 17.8489264305913841 } },
  { id: 2, position: { lat: 59.32020887130939, lon: 17.94097074677702 } },
  { id: 3, position: { lat: 59.39020887130939, lon: 17.96097074677702 } }
]

oboy((expect, sinon, proxyquire) => {
  let osrm, time, position

  beforeEach(function () {
    osrm = { route: sinon.stub() }
    time = proxyquire('../../lib/time', {'./osrm': osrm})
    position = { lat: 59.34599123091426, lon: 17.91422590050599 }

    osrm.route.onCall(0).resolves({ duration: 100 })
    osrm.route.onCall(1).resolves({ duration: 50 })
    osrm.route.onCall(2).resolves({ duration: 1100 })
  })

  it('should return the cars including estimated time to a point', function (done) {
    time.fastestCars(closestCars, position)
      .map(hit => hit.tta)
      .toArray(arr => {
        try {
          expect(osrm.route).to.be.calledThrice
          expect(arr).to.eql([50, 100, 1100])
          done()
        } catch (err) { done(err) }
      })
  })

  it('should sort the cars in estimated time to a point', function (done) {
    time.fastestCars(closestCars, position)
      .sortBy((a, b) => a.tta - b.tta)
      .map(hit => hit.car.id)
      .toArray(arr => {
        try {
          expect(osrm.route).to.be.calledThrice
          expect(arr).to.eql([2, 1, 3])
          done()
        } catch (err) { done(err) }
      })
  })

  it('should be able to estimateTimeToArrival per row', function (done) {
    _(closestCars)
    .flatMap(car => _(time.estimateTimeToArrival(car, position)))
    .tap(car => console.log('tta', car.tta))
    .sortBy((a, b) => a.tta - b.tta)
    .errors(err => console.error('fastestCars', err))
    .map(hit => hit.car.id)
    .collect()
    .doto(cars => {
      expect(cars).to.eql([2, 1, 3])
    })
    .each(row => done())
  })
})
