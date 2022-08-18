const { save } = require('./elastic')

const collectExperimentMetadata = (experiment) => {
  return save(experiment, 'experiments')
}

const collectJourney = (journey) => {
  return save(journey, 'journeys')
}

module.exports = {
  collectExperimentMetadata,
  collectJourney,
}
