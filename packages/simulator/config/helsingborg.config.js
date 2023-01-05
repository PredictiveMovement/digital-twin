const includedMunicipalities = ['Helsingborg']
const ignoreWelcomeMessage = true
const defaultEmitters = [
  'cars',
  'postombud',
  'kommuner',
  'bookings',
  'measureStations',
]

const mapInitState = {
  latitude: 55.901021,
  longitude: 13.001441,
  bearing: 0,
  zoom: 9, // min ~0.6 max 24.0
  pitch: 40,
}

module.exports = {
  defaultEmitters,
  ignoreWelcomeMessage,
  includedMunicipalities,
  mapInitState,
}
