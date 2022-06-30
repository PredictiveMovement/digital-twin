const { mergeAll, timer, of } = require('rxjs')
const {
  toArray,
  map,
  tap,
  filter,
  takeUntil,
  delay,
  mergeMap,
  catchError,
  groupBy,
  take,
} = require('rxjs/operators')
const { plan } = require('./vroom')
const moment = require('moment')

const stopToJob = ({ id, position, arrivalTime, departureTime }, i) => ({
  id: i,
  time_windows: [
    [
      moment(arrivalTime, 'HH:mm:ss')
        .subtract(moment().startOf('day'))
        .valueOf(),
      moment(departureTime, 'HH:mm:ss')
        .subtract(moment().startOf('day'))
        .valueOf(),
    ],
  ],
  location: [position.lat, position.lon],
})

const taxiToVehicle = ({ position, heading }, i) => ({
  id: i,
  start: [position.lat, position.lon],
  end: heading ? [heading.lat, heading.lon] : undefined,
})

const taxiDispatch = (taxis, stops) =>
  stops.pipe(
    //tap((stop) => console.log('stop', stop)),
    toArray(),
    mergeMap((stops) =>
      taxis.pipe(
        //tap((taxi) => console.log('taxi', taxi)),
        takeUntil(timer(5000)), // to be able to sort we have to batch somehow. Lets start with time
        toArray(),
        filter((taxis) => taxis.length > 0),
        tap((taxis) =>
          console.log('taxi dispatch', stops.length, taxis.length)
        ),
        mergeMap(async (taxis) => {
          const result = await plan({
            jobs: stops.map(stopToJob),
            vehicles: taxis.map(taxiToVehicle),
          })
          return {
            taxis,
            result,
          }
        }),
        map(({ taxis, result: { vehicle: i, steps } = {} }) => ({
          taxi: taxis[i],
          stops: steps
            .filter((s) => s.type === 'job')
            .map(({ id: i }) => stops[i]),
        }))
      )
    )
  )

module.exports = {
  taxiDispatch,
}
