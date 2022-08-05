const fetch = require('node-fetch')
const vroomUrl = process.env.VROOM_URL || 'https://vroom.iteam.services/'
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
    }).then((res) => res.json())
    if (result.error) throw new Error(result.error)
    console.log(
      'Results from vroom, computing_times:',
      result.summary.computing_times
    )
    return result
  },
}
