const { Subject, mergeMap, catchError, from, tap } = require('rxjs')
const { debug, error } = require('./log')

const API_CALL_LIMIT = 100

const queueSubject = new Subject()

let queueLength = 0

function queue(fn) {
  queueLength++
  return new Promise((resolve, reject) => {
    queueSubject.next({
      fn: () => {
        return fn()
      },
      resolve,
      reject,
    })
  })
}
// Hantera köade anrop med RxJS
queueSubject
  .pipe(
    // Begränsa antalet samtidiga anrop med mergeMap
    mergeMap(
      ({ fn, resolve, reject }) =>
        from(fn()).pipe(
          // Hantera lyckade anrop och fel
          mergeMap((result) => {
            queueLength--
            debug('queueLength', queueLength)
            resolve(result)
            return []
          }),
          catchError((err) => {
            queueLength--
            error('error queue', err, queueLength)
            reject(err)
            return []
          })
        ),
      API_CALL_LIMIT
    )
  )
  .subscribe()

module.exports = queue
