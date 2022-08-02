const elastic = require('elasticsearch')
const mappings = require('../data/elasticsearch_mappings.json')

const host = process.env.ELASTICSEARCH

if (!host) {
  console.log('No elasticsearch url provided, skipping statistics collection')
  const noOp = (name) => (value) => {
    console.log(`noOp: ${name}`)
  }
  module.exports = {
    save: noOp('save'),
    connect: noOp('connect'),
  }
  return
} else {
  console.log(`Elasticsearch url provided, collecting statistics to ${host}`)
}

const client = new elastic.Client({ node: host, log: 'error' })
const connect = Promise.all(
  Object.keys(mappings).map((index) =>
    client.indices
      .create({
        index,
        body: mappings[index],
      })
      .catch((err) => {
        if (err.meta.body.error.type === 'resource_already_exists_exception') {
          console.log(`
            Index ${index} already mapped.
            If you want to re-map it:
            - Delete it in Elasticsearch
            - Re-run this script
            - Recreate "index pattern" in kibana.`)
        } else {
          console.error(err)
        }
      })
  )
)

const save = (booking, indexName) => {
  return connect.then(() =>
    client
      .index({
        index: indexName,
        id: booking.id,
        body: booking,
      })
      .then((_) => console.log('Saved!'))
      .catch(console.error)
      .finally(() => process.exit())
  )
}

module.exports = {
  save,
}
