const elastic = require('@elastic/elasticsearch')

const mappings = require('../data/elasticsearch_mappings.json')

const { error, info } = require('./log')

const host = process.env.ELASTICSEARCH_URL

if (!host) {
  info('No elasticsearch url provided, skipping statistics collection')
  const noOp = (name) => (value) => {
    // info(`noOp: ${name}`)
  }
  module.exports = {
    save: noOp('save'),
    createIndices: noOp('createIndices'),
  }
  return
} else {
  info(`Elasticsearch url provided, collecting statistics to ${host}`)
}

const client = new elastic.Client({ node: host, log: 'error' })

const createIndices = () =>
  Promise.all(
    Object.keys(mappings).map((index) => {
      return client.indices
        .create({
          index,
          body: mappings[index],
        })
        .catch((err) => {
          let errorType
          try {
            errorType = JSON.parse(err.response)?.error?.type
          } catch (e) {
            error(
              '>>>= Cannot create indices, Malformed Elasticsearch Error',
              e,
              err
            )
          }
          if (errorType === 'resource_already_exists_exception') {
            error(`
            Index ${index} already mapped.
            If you want to re-map it:
            - Delete it in Elasticsearch
            - Re-run this script
            - Recreate "index pattern" in kibana.
          `)
          } else {
            error('>>>= Cannot create indices, Unkown Elasticsearch Error', err)
          }
        })
    })
  )

const save = (booking, indexName) => {
  return client
    .index({
      index: indexName,
      id: booking.id,
      body: booking,
    })
    .then((_) => {})
    .catch((e) => {
      error('Could not save booking', e)
    })
}

const search = (searchQuery) => {
  return client.search(searchQuery)
}

module.exports = {
  createIndices,
  save,
  search,
}
