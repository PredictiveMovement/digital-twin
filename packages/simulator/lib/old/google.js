const distance = require('google-distance')
const key = process.env.GOOGLE_API_KEY
distance.apiKey = key

module.exports = {
  distance: function (from, to, date) {
    return new Promise((resolve, reject) => {
      distance.get({
        origin: [from.lat, from.lon].toString(),
        destination: [to.lat, to.lon].toString(),
        duration_in_traffic: true
      }, (err, data) => {
        if (err) return reject(err)
        return resolve({ meters: data.distanceValue, seconds: data.durationValue, raw: data })
      })
    })
  }
}
