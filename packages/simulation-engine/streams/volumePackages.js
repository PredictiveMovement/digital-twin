const { from } = require('rxjs')
const { readXlsx } = require('../adapters/xlsx')

const volumePackages = readXlsx(
  `${process.cwd()}/data/volume.xlsx`,
  `${'Sammanställning'}`
).map(
  ({
    Kommunkod,
    Kommun,
    'Total paket 2020': TotalPaket,
    'Total B2B paket 2020': TotalB2B,
    'Total B2C paket 2020': TotalB2C,
    'Total C2X paket 2020': TotalC2X,
    'Paketbrev 2020': PaketBrev,
  }) => ({
    Kommunkod,
    Kommun,
    TotalPaket,
    TotalB2B,
    TotalB2C,
    TotalC2X,
    PaketBrev,
  })
)

module.exports = from(volumePackages)
