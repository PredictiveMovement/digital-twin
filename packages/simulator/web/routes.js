const { combineLatest, from } = require('rxjs')
const {
  map,

  take,
  toArray,
  mergeMap,
  bufferTime,
  scan,
  filter,
  startWith,
  throttleTime,
  windowTime,
  groupBy,
  last,
} = require('rxjs/operators')

const engine = require('../index')
const { virtualTime } = require('../lib/virtualTime')
const { saveParameters } = require('../lib/fileUtils')

const cleanBookings = () => (bookings) =>
  bookings.pipe(
    map(
      ({
        pickup: { position: pickup },
        destination: { position: destination, name },
        id,
        status,
        isCommercial,
        co2,
        cost,
        deliveryTime,
        car,
      }) => ({
        id,
        pickup,
        destination,
        name,
        status,
        isCommercial,
        deliveryTime,
        co2,
        cost,
        carId: car?.id,
      })
    )
  )

const cleanCars = ({
  booking,
  position: { lon, lat },
  id,
  altitude,
  heading,
  speed,
  bearing,
  status,
  fleet,
  cargo,
  capacity,
  queue,
  co2,
  distance,
  lineNumber,
  vehicleType,
}) => ({
  id,
  heading: (heading && [heading.lon, heading.lat]) || null, // contains route to plot or interpolate on client side.
  speed,
  bearing,
  position: [lon, lat, altitude || 0],
  status,
  fleet: fleet?.name || 'Privat',
  co2,
  distance,
  cargo: cargo.length,
  queue: queue.length,
  capacity,
  lineNumber,
  vehicleType,
})

function register(io) {
  let emitCars = true
  let emitTaxiUpdates = true
  let emitBusUpdates = true
  let subscriptions = []
  let experiment

  const startCarUpdatesSubscription = (experiment, io) =>
    experiment.carUpdates
      .pipe(
        windowTime(100), // start a window every x ms
        mergeMap((win) =>
          win.pipe(
            groupBy((car) => car.id), // create a stream for each car in this window
            mergeMap((cars) => cars.pipe(last())) // take the last update in this window
          )
        ),
        filter((car) => {
          if (!car) return false
          if (car.vehicleType === 'bus' && !emitBusUpdates) return false
          if (car.vehicleType === 'taxi' && !emitTaxiUpdates) return false
          if (car.vehicleType === 'car' && !emitCars) return false
          return true
        }),
        map(cleanCars),
        map((vehicle) =>
          Object.assign({ experimentId: experiment.parameters.id }, vehicle)
        ),
        bufferTime(100, null, 100)
      )
      .subscribe((cars) => {
        // console.log(cars)
        // if (!cars.length) return
        io.emit('cars', cars)
      })

  io.on('connection', function (socket) {
    socket.emit('parameters', experiment.parameters)
    socket.emit('reset')

    setUpSocketListeners(socket)
    replayOldDataToNewClient(socket)
  })

  const setUpSocketListeners = (socket) => {
    socket.on('reset', () => {
      subscriptions.map((e) => e.unsubscribe())
      experiment = engine.createExperiment()
      subscriptions = start(experiment)
      virtualTime.reset()
    })

    socket.on('play', () => {
      virtualTime.play()
    })

    socket.on('pause', () => {
      virtualTime.pause()
    })

    socket.on('speed', (speed) => {
      virtualTime.setTimeMultiplier(speed)
    })

    socket.on('carLayer', (value) => {
      emitCars = value
    })

    socket.on('taxiUpdatesToggle', (value) => {
      emitTaxiUpdates = value
    })

    socket.on('busUpdatesToggle', (value) => {
      emitBusUpdates = value
    })

    socket.on('experimentParameters', (value) => {
      console.log('new expiriment settings: ', value)
      saveParameters(value)
      socket.emit('reset')
    })
  }

  const replayOldDataToNewClient = (socket) => {
    experiment.buses
      .pipe(
        map(cleanCars),
        map((vehicle) =>
          Object.assign({ experimentId: experiment.parameters.id }, vehicle)
        )
      )
      .subscribe((e) => {
        // console.log(e)
        socket.emit('cars', [e])
      })
    experiment.kommuner
      .pipe(map(({ id, name, geometry, co2 }) => ({ id, name, geometry, co2 })))
      .subscribe((kommun) => socket.emit('kommun', kommun))
    experiment.dispatchedBookings
      .pipe(bufferTime(100, null, 1000))
      .subscribe((bookings) => {
        if (bookings.length) {
          io.socket('bookings', bookings)
        }
      })
    experiment.passengers.pipe(toArray()).subscribe((passengers) => {
      console.log('sending', passengers.length, 'passengers')
      return passengers.map((passenger) => {
        socket.emit('passenger', passenger.toObject())
      })
    })

    experiment.taxis.subscribe(({ id, position: { lon, lat } }) => {
      socket.emit('taxi', { id, position: [lon, lat] })
    })
    experiment.postombud.pipe(toArray()).subscribe((postombud) => {
      socket.emit('postombud', postombud)
    })
    experiment.busStops.subscribe((busStops) =>
      socket.emit('busStops', busStops)
    )
    experiment.lineShapes.subscribe((lineShapes) =>
      socket.emit('lineShapes', lineShapes)
    )
  }
  const start = (experiment) => {
    setInterval(() => {
      io.emit('time', experiment.virtualTime.time())
    }, 1000)

    const carSubscription = startCarUpdatesSubscription(experiment, io)

    const passengerSub = experiment.passengerUpdates.subscribe((passenger) => {
      if (passenger.position) {
        io.emit('passenger', passenger)
      }
    })

    const bookingSub = experiment.bookingUpdates
      .pipe(cleanBookings(), bufferTime(100, null, 1000))
      .subscribe((bookings) => {
        if (bookings.length) {
          io.emit('bookings', bookings)
        }
      })
    io.emit('parameters', experiment.parameters)
    replayOldDataToNewClient(io)
    return [carSubscription, bookingSub, passengerSub]
  }
  if (!experiment) {
    experiment = engine.createExperiment()
  }
  subscriptions = start(experiment)

  experiment.kommuner
    .pipe(
      mergeMap(({ id, dispatchedBookings, name, cars, co2 }) => {
        const totalBookings = dispatchedBookings.pipe(
          scan((a) => a + 1, 0),
          startWith(0)
        )

        const averageDeliveryTime = dispatchedBookings.pipe(
          mergeMap((booking) => booking.deliveredEvents),
          scan(
            ({ total, deliveryTimeTotal }, { deliveryTime }) => ({
              total: total + 1,
              deliveryTimeTotal: deliveryTimeTotal + deliveryTime,
            }),
            { total: 0, deliveryTimeTotal: 0 }
          ),
          startWith({ total: 0, deliveryTimeTotal: 0 }),
          map(({ total, deliveryTimeTotal }) => ({
            totalDelivered: total,
            averageDeliveryTime: deliveryTimeTotal / total / 60 / 60,
          }))
        )

        const averageUtilization = cars.pipe(
          mergeMap((car) => car.cargoEvents),
          scan((acc, car) => ({ ...acc, [car.id]: car }), {}),
          map((cars) => {
            const result = {
              totalCapacity: 0,
              totalCargo: 0,
              totalCo2: 0,
              totalQueued: 0,
            }
            Object.values(cars).forEach((car) => {
              result.totalCargo += car.cargo.length
              result.totalCapacity += car.capacity
              result.totalQueued += car.queue.length
              result.totalCo2 += car.co2
            })
            return result
          }),
          map(({ totalCargo, totalCapacity, totalQueued, totalCo2 }) => ({
            totalCargo,
            totalCapacity,
            totalQueued,
            averageUtilization: totalCargo / totalCapacity,
            averageQueued: totalQueued / totalCapacity,
            totalCo2: co2,
          })),
          startWith({
            totalCargo: 0,
            totalCapacity: 0,
            totalQueued: 0,
            averageUtilization: 0,
            averageQueued: 0,
            totalCo2: 0,
          })
        )

        const totalCars = cars.pipe(
          scan((a) => a + 1, 0),
          startWith(0)
        )

        const totalCapacity = cars.pipe(
          filter((car) => car.capacity),
          scan((a, car) => a + car.capacity, 0),
          startWith(0)
        )

        return combineLatest([
          totalBookings,
          totalCars,
          averageUtilization,
          averageDeliveryTime,
          totalCapacity,
        ]).pipe(
          map(
            ([
              totalBookings,
              totalCars,
              {
                totalCargo,
                totalQueued,
                totalCo2,
                averageQueued,
                averageUtilization,
              },
              { totalDelivered, averageDeliveryTime },
              totalCapacity,
            ]) => ({
              id,
              name,
              totalBookings,
              totalCars,
              totalCargo,
              totalCo2,
              totalCapacity,
              averageDeliveryTime,
              totalDelivered,
              totalQueued,
              averageQueued,
              averageUtilization,
            })
          ),
          // Do not emit more than 1 event per kommun per second
          throttleTime(1000)
        )

        // return combineLatest([totalBookings, totalCars, averageUtilization, averageDeliveryTime, totalCapacity]).pipe(
        //   map(([totalBookings, totalCars, { totalCargo, averageUtilization, totalQueued, averageQueued }, { totalDelivered, averageDeliveryTime }, totalCapacity]) => ({
        //     id, name, totalBookings, totalCars, totalCargo, totalCapacity, averageUtilization, averageDeliveryTime, totalDelivered, totalQueued, averageQueued
        //   })),
        //   // Do not emit more than 1 event per kommun per second
        //   throttleTime(5000)
        // )
      }),
      filter(({ totalCars }) => totalCars > 0)
    )
    .subscribe((kommun) => {
      io.emit('kommun', kommun)
    })
}
module.exports = {
  register,
}
