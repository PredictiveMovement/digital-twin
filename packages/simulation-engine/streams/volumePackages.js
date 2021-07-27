const { from } = require('rxjs')
const { readXlsx } = require('../adapters/xlsx')

const volumePackages = readXlsx(
  `${process.cwd()}/data/Volym_2020_per_kommun.xlsx`,
  `${'Sammanställning'}`
).map(
  ({
    Kommunkod: kod,
    Kommun: namn,
    'Total paket 2020': totalPaket,
    'Total B2B paket 2020': totalB2B,
    'Total B2C paket 2020': totalB2C,
    'Total C2X paket 2020': totalC2X,
    'Paketbrev 2020': paketBrev,
  }) => ({
    kod,
    namn,
    totalPaket,
    totalB2B,
    totalB2C,
    totalC2X,
    paketBrev,
  })
)

module.exports = from(volumePackages)
