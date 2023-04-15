const kmeans = require('node-kmeans')
const assert = require('assert')
const { write } = require('./log')

const clusterPositions = (input, nrOfClusters = 5) => {
  const vectors = input.map(({ pickup, position = pickup.position }) => [
    position.lon,
    position.lat,
  ])
  assert(
    vectors.length < 300,
    'Too many positions to cluster:' + vectors.length
  )
  write('k..')
  return new Promise((resolve, reject) =>
    kmeans.clusterize(vectors, { k: nrOfClusters }, (err, res) => {
      write('.m')
      if (err) return reject(err)
      const clusters = res.map((cluster) => ({
        center: { lon: cluster.centroid[0], lat: cluster.centroid[1] },
        items: cluster.clusterInd.map((i) => input[i]),
      }))
      resolve(clusters)
    })
  )
}

module.exports = { clusterPositions }
/*
test:

const positions = [
  { position: { lon: -0.1388888888888889, lat: 51.5 } },
  { position: { lon: -0.5388888888888889, lat: 52.5 } },
  { position: { lon: -0.4388888888888889, lat: 53.5 } },
  { position: { lon: -0.3388888888888889, lat: 54.5 } },
  { position: { lon: -0.2388888888888889, lat: 55.5 } },
  { position: { lon: -0.2388888888888889, lat: 56.5 } },
]

const clusters = clusterPositions(positions, 3).then((res) => {
  console.log(res)
})
*/
