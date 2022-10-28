const fetch = require('node-fetch')
// eslint-disable-next-line no-undef
const vroomUrl = process.env.VROOM_URL || 'https://vroom.predictivemovement.se/'
const { info } = require('./log')

module.exports = {
  async plan({ jobs, shipments, vehicles }) {
    return await fetch(vroomUrl, {
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
      .then(async (res) =>
        !res.ok ? Promise.reject('Vroom error:' + (await res.text())) : res
      )
      .then((res) => res.json())
  },
}
