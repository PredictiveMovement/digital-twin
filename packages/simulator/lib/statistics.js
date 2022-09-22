const { save } = require('./elastic')

const collectExperimentMetadata = (experiment) => {
  return save(experiment, 'experiments')
}

const collectBooking = (booking) => {
  return save(
    {
      ...booking,
      timestamp: new Date(),
      passenger: booking.passenger.toObject(),
    },
    'bookings'
  )
}

module.exports = {
  collectExperimentMetadata,
  collectBooking,
}
