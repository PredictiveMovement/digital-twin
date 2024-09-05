const { from } = require('rxjs')
const { map, mergeMap, shareReplay } = require('rxjs/operators')
const fs = require('fs').promises

function execute() {
  // Adjust the file path as necessary
  //const filePath = `${process.cwd()}/data/telge/ruttdata_2024-09-03.txt`
  const filePath = `${process.cwd()}/data/telge/test.json`

  return from(fs.readFile(filePath, 'utf8')).pipe(
    mergeMap((fileContent) => {
      // Parse the JSON data from the file
      const data = JSON.parse(fileContent)
      return from(data)
    }),
    map(
      ({
        Lat,
        Lng,
        Turid,
        Datum,
        Bil,
        Kundnr,
        Hsnr,
        Tjnr,
        Dec,
        Turordningsnr,
        Avftyp,
        Tjtyp,
        Frekvens,
        Schemalagd,
      }) => ({
        turId: Turid,
        date: Datum,
        vehicle: Bil,
        customerNumber: Kundnr,
        houseNumber: Hsnr,
        jobNumber: Tjnr,
        decision: Dec,
        sequenceNumber: Turordningsnr,
        wasteType: Avftyp,
        serviceType: Tjtyp,
        frequency: Frekvens,
        scheduled: Schemalagd,
        position: { lat: Lat, lon: Lng },
      })
    ),
    shareReplay()
    // You can use shareReplay if you need the data to be multicasted to multiple subscribers
  )
}

execute().subscribe({
  next: (value) => console.log('Output value:', value),
  error: (err) => console.error('Error:', err),
  complete: () => console.log('Completed reading and processing the JSON file'),
})

module.exports = execute()
