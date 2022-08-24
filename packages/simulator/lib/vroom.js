const fetch = require('node-fetch')
const vroomUrl = process.env.VROOM_URL || 'https://vroom.predictivemovement.se/'
const { decodePolyline } = require('./osrm')

module.exports = {
  async plan({ jobs, shipments, vehicles }) {
    // console.log('VROOM', shipments)
    const result = await fetch(vroomUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobs,
        shipments,
        vehicles,
      }),
    })
      .then((res) => (!res.ok ? Promise.reject(res.text()) : res))
      .then((res) => res.json())
    console.log(
      'Results from vroom, computing_times:',
      result.summary.computing_times
    )
    return result
  },
}
