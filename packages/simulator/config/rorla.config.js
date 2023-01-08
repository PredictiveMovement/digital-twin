const includedMunicipalities = [
  'Arjeplog',
  'Arvidsjaur',
  'Boden',
  'Gällivare',
  'Haparanda',
  'Jokkmokk',
  'Kalix',
  'Kiruna',
  'Luleå',
  'Pajala',
  'Piteå',
  'Älvsbyn',
  'Överkalix',
  'Övertorneå',
]
const defaultEmitters = [
  'taxis',
  'buses',
  'busStops',
  'busLines',
  'passengers',
  'kommuner',
]

const mapInitState = {
  latitude: 65.0964472642777,
  longitude: 17.112050188704504,
  bearing: 0,
  zoom: 5, // min ~0.6 max 24.0
  pitch: 40,
}

module.exports = {
  defaultEmitters,
  includedMunicipalities,
  mapInitState,
}
