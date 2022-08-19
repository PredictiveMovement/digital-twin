const { save } = require('./elastic')

const collectExperimentMetadata = (experiment) => {
  return save(experiment, 'experiments')
}

const collectJourney = (journey) => {
  return save({  ...journey, timestamp: new Date(),
    passenger: {
      ...journey.passenger,
      distance: journey.passenger.distance / 1000,
      moveTime: journey.passenger.moveTime / 1000 / 60,
      waitTime: journey.passenger.waitTime / 1000 / 60,
    }
  }, 'journeys')
}

module.exports = {
  collectExperimentMetadata,
  collectJourney,
}
