const bookings = require('./sample.json')
const _ = require('highland')
const osrm = require('../../lib/osrm')
const price = require('../../lib/price')
const oboy = require('oboy')

oboy((expect, sinon, proxyquire) => {
  describe('price validator', function () {
    it('should calculate an average close to real world samples', function (done) {
      this.timeout(20000)

      _(bookings.hits.hits)
      .take(2000)
      .map(hit => hit._source)
      .pick(['pickupStreet', 'pickupDatetime', 'pickupLatitude', 'pickupLongitude', 'fixedPrice', 'destinationLongitude', 'destinationLatitude', 'totalAmount', 'distance', 'travelTime'])
      .filter(hit => !hit.fixedPrice)
      // .filter(hit => new Date(hit.pickupDatetime))
      .flatMap(original => {
        return _(osrm.route({
          lon: original.pickupLongitude,
          lat: original.pickupLatitude
        }, {
          lon: original.destinationLongitude,
          lat: original.destinationLatitude
        }))
        .map(route => {
          const estimatedTotal = price.price(route)
          return { estimatedTotal, route, original }
        })
      })
      .errors(err => console.log(err))
      .map(summary => {
        console.log(`=====
                    Date: ${summary.original.pickupDatetime}
                    ${summary.original.pickupStreet} - ${summary.original.destinationStreet}
                    Estimated Total: ${summary.estimatedTotal}kr
                    Actual Total ${summary.original.totalAmount}kr
                    Diff: ${Math.round(summary.original.totalAmount / summary.estimatedTotal * 100)}%

                    Estimated distance: ${summary.route.distance}
                    Actual distance: ${summary.original.distance}
                    Diff: ${Math.round(summary.original.distance / summary.route.distance * 100)}%

                    Estimated time: ${summary.route.duration}
                    Actual time: ${summary.original.travelTime}
                    Diff: ${Math.round(summary.original.travelTime / summary.route.duration * 100)}%
                    `)
        return { val: Math.round(summary.original.totalAmount / summary.estimatedTotal), count: 1 }
      })
      .collect()
      .errors(done)
      .each(diffs => {
        try {
          const avg = diffs.reduce((a, b) => {
            const c = { count: a.count + b.count, val: a.val + b.val }
            c.avg = c.val / c.count
            return c
          })
          console.log(avg)
          expect(avg.avg).to.be.at.most(1.1)
          expect(avg.avg).to.be.at.least(0.9)
          done()
        } catch (err) {
          done(err)
        }
      })
    })
  })
})
