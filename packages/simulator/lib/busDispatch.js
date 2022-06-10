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

const busToVehicle = ({ position, heading }, i) => ({
  id: i,
  start: [position.lat, position.lon],
  end: heading ? [heading.lat, heading.lon] : undefined,
})

const busDispatch = (buses, stops) =>
  stops.pipe(
    //tap((stop) => console.log('stop', stop)),
    toArray(),
    mergeMap((stops) =>
      buses.pipe(
        //tap((bus) => console.log('bus', bus)),
        takeUntil(timer(5000)), // to be able to sort we have to batch somehow. Lets start with time
        toArray(),
        filter((buses) => buses.length > 0),
        tap((buses) => console.log('bus dispatch', stops.length, buses.length)),
        mergeMap(async (buses) => {
          const result = await plan({
            jobs: stops.map(stopToJob),
            vehicles: buses.map(busToVehicle),
          })
          return {
            buses,
            result,
          }
        }),
        map(({ buses, result: { vehicle: i, steps } = {} }) => ({
          bus: buses[i],
          stops: steps
            .filter((s) => s.type === 'job')
            .map(({ id: i }) => stops[i]),
        }))
      )
    )
  )

module.exports = {
  busDispatch,
}
