let includedMunicipalities = [
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
if (process.env.PROJECT_NAME === 'Helsingborg') {
  includedMunicipalities = ['Helsingborg']
}

module.exports = {
  includedMunicipalities,
}

