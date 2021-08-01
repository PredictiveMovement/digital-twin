const { from } = require('rxjs')
const { readXlsx } = require('../adapters/xlsx')

const volumePackages = readXlsx(
  `${process.cwd()}/data/Volym_2020_per_kommun.xlsx`,
  `${'Sammanställning'}`
).map(
  ({
    Kommunkod: id,
    Kommun: name,
    'Total paket 2020': totalPaket,
    'Total B2B paket 2020': totalB2B,
    'Total B2C paket 2020': totalB2C,
    'Total C2X paket 2020': totalC2X,
    'Paketbrev 2020': paketBrev,
  }) => ({
    id,
    name,
    totalPaket: Math.floor(totalPaket),
    totalB2B: Math.floor(totalB2B), 
    totalB2C: Math.floor(totalB2C),
    totalC2X: Math.floor(totalC2X),
    paketBrev: Math.floor(paketBrev),
  })
)

module.exports = from(volumePackages)
