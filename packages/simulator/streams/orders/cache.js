const { from, bufferCount } = require('rxjs')
const telge = require('./telge')
const fs = require('fs')

const file = fs.createWriteStream('output.json')

from(telge)
  .pipe(bufferCount(10))
  .subscribe((data) => {
    file.write(
      JSON.stringify(
        data.map((b) => b.toObject()),
        null,
        2
      )
    )
  })
