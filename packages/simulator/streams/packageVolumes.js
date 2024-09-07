const volumes = require('../data/Volym_2020_per_kommun.json')
module.exports = volumes
// const { from, toArray } = require('rxjs')
// const { readXlsx } = require('../adapters/xlsx')
// const fs = require('fs')

// const packageVolumes = readXlsx(
//   `${process.cwd()}/data/Volym_2020_per_municipality.xlsx`,
//   `${'Sammanställning'}`
// ).map(
//   ({
//     Municipalitykod: id,
//     Municipality: name,
//     'Total paket 2020': totalPaket = 0,
//     'Total B2B paket 2020': totalB2B = 0,
//     'Total B2C paket 2020': totalB2C = 0,
//     'Total C2X paket 2020': totalC2X = 0,
//     'Paketbrev 2020': paketBrev = 0,
//   }) => ({
//     id,
//     name,
//     total: Math.floor(totalPaket),
//     B2B: Math.floor(totalB2B),
//     B2C: Math.floor(totalB2C),
//     C2X: Math.floor(totalC2X),
//     brev: Math.floor(paketBrev),
//   })
// )

// from(packageVolumes)
//   .pipe(toArray())
//   .subscribe(data => fs.writeFileSync('somefile.json', JSON.stringify(data)))

// module.exports = from(packageVolumes)
