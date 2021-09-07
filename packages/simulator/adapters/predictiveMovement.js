const fetch = require('node-fetch')
const pelias = require('../lib/pelias')
const { info, error } = require('../lib/log')

// const API_URL = 'https://api-dev.predictivemovement.se'
const API_URL = 'http://localhost:8000'

const addressToApiAddress = address => {
  const apiAddress = {
    city: address.city,
    name: address.name,
    street: address.street,
    position: address.position,
  }

  // Hack to set city
  if (!apiAddress.city) {
    apiAddress.city = address.locality ?? address.county
  }

  // Hack to set street
  if (!apiAddress.street) {
    apiAddress.street = address.name
  }

  return apiAddress
}

const lookupAddress = position => {
  return pelias
    .nearest(position)
    .then(address => {
      return address
    }, (err) => {
      console.log('pelias error', err)
      throw err
    })
    .then(address => {
      return addressToApiAddress(address)
    })
}

const bookingToApiBooking = async booking => {
  const apiBooking = {
    pickup: {
      address: await lookupAddress(booking.pickup.position),
    },
    delivery: {
      address: addressToApiAddress(booking.destination),
    },
    metadata: {},
    size: {
      measurements: [
        105,
        55,
        16
      ],
      weight: 10
    },
  }

  return apiBooking
}

module.exports = {
  createBooking: async (booking) => {
    let body = await bookingToApiBooking(booking)

    fetch(`${API_URL}/bookings`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)

    })
      .then(res => {
        if (res.ok) {
          return res.json()
        } else {
          res.json().then(e => {
            error('PM API', 'Create Booking error', e)
            info('', body.delivery)
            info('', body.pickup)
          })

        }
      })
      .then(data => info('Booking created in API, id:', data.id))
  },

  createTransport: async (transport) => {
    const address = await lookupAddress(transport.origin)

    const apiTransport = {
      start_address: address,
      end_address: address,
      capacity: {
        volume: 10,
        weight: 10,
      }
    }

    fetch(`${API_URL}/transports`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiTransport)
    })
      .then(res => res.json())
      .then(data => info('Transport created in API, id:', data.id))
  }
}
