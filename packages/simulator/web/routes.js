const { combineLatest, pipe } = require('rxjs')
const {
  map,
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
const { info } = require('../lib/log')
const { defaultEmitters } = require('../config')

const count = () => pipe(scan((acc) => acc + 1, 0))

const cleanBookings = () =>
  // TODO: Replace cleanBookings with .toObject() on Booking
  pipe(
    map(
      ({
        pickup,
        destination,
        id,
        status,
        isCommercial,
        co2,
        cost,
        deliveryTime,
        car,
        type,
      }) => ({
        id,
        pickup: pickup.position,
        destination: destination.position,
        status,
        isCommercial,
        deliveryTime,
        co2,
        cost,
        carId: car?.id,
        type,
      })
    )
  )

const cleanCars = ({
  // TODO: Replace cleanCars with .toObject() on Vehicle
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
  let emitCars = defaultEmitters.includes('cars')
  let emitTaxiUpdates = defaultEmitters.includes('taxis')
  let emitBusUpdates = defaultEmitters.includes('buses')

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
        if (!cars.length) return
        io.emit('cars', cars)
      })

  io.on('connection', function (socket) {
    socket.emit('parameters', experiment.parameters)
    socket.emit('reset')

    setUpSocketListeners(socket)
    replayBaseDataToNewClient(socket)
  })

  const setUpSocketListeners = (socket) => {
    socket.on('reset', () => {
      subscriptions.map((e) => e.unsubscribe())
      experiment = engine.createExperiment({ defaultEmitters })
      virtualTime.reset()
      subscriptions = start(experiment)
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
      info('New expiriment settings: ', value)
      saveParameters(value)
      socket.emit('reset')
    })
  }

  /**
   * Replay all static data that is used to setup the experiment.
   * @param {*} socket
   */
  const replayBaseDataToNewClient = (socket) => {
    info('Replaying base data to new client')
    experiment.buses
      .pipe(
        map(cleanCars),
        map((vehicle) =>
          Object.assign({ experimentId: experiment.parameters.id }, vehicle)
        )
      )
      .subscribe((e) => {
        socket.emit('cars', [e])
      })
    experiment.kommuner
      .pipe(map(({ id, name, geometry, co2 }) => ({ id, name, geometry, co2 })))
      .subscribe((kommun) => socket.emit('kommun', kommun))

    experiment.dispatchedBookings
      .pipe(cleanBookings(), bufferTime(100, null, 1000))
      .subscribe((bookings) => {
        if (bookings.length) {
          socket.emit('bookings', bookings)
        }
      })

    experiment.cars.pipe(map(cleanCars)).subscribe((car) => {
      socket.emit('cars', [car])
    })

    experiment.passengers.subscribe((passenger) => {
      info('Passenger created and emitted', passenger.name)
      socket.emit('passenger', passenger.toObject())
    })

    // experiment.passengerUpdates.subscribe((booking) => {
    //   if(booking.type === 'passenger') {
    //     info("Passenger update", `${booking.passenger.name}, ${booking.id}, ${booking.status}`)
    //     socket.emit('passenger', passenger.toObject())
    //   } else
    //     info("Booking update", booking.id)
    //   // socket.emit(
    //   //   'bookings',
    //   //   passenger.bookings.map((b) => b.toObject())
    //   // )
    // })

    experiment.taxis.subscribe(({ id, position: { lon, lat } }) => {
      socket.emit('taxi', { id, position: [lon, lat] })
    })
    experiment.postombud.pipe(toArray()).subscribe((postombud) => {
      socket.emit('postombud', postombud)
    })
    experiment.measureStations.pipe(toArray()).subscribe((measureStations) => {
      socket.emit('measureStations', measureStations)
    })
    experiment.busStops.subscribe((busStops) =>
      socket.emit('busStops', busStops)
    )
    experiment.lineShapes.subscribe((lineShapes) =>
      socket.emit('lineShapes', lineShapes)
    )
  }
  const start = (experiment) => {
    const timeSubscription = virtualTime
      .getTimeInMilliseconds()
      .subscribe((milliseconds) => io.emit('time', milliseconds))

    const carSubscription = startCarUpdatesSubscription(experiment, io)

    // UNCOMMENT THIS AND THINGS WILL BURN! 🔥 🔥 🔥 (but it's fun to watch)
    // const passengerSub = experiment.passengerUpdates.subscribe((passenger) => {
    //   if (passenger.position) {
    //     io.emit('passenger', passenger)
    //   } else {
    //     console.log("passenger without position:", passenger)
    //   }
    // })

    const bookingSub = experiment.bookingUpdates
      .pipe(cleanBookings(), bufferTime(100, null, 1000))
      .subscribe((bookings) => {
        if (bookings.length) {
          bookings.map((booking) => {
            console.log(
              'booking update',
              booking.id,
              booking.status,
              booking?.passenger?.name
            )
          })
          io.emit('bookings', bookings)
        }
      })
    io.emit('parameters', experiment.parameters)
    replayBaseDataToNewClient(io)
    return [carSubscription, bookingSub /*, passengerSub*/]
  }
  if (!experiment) {
    experiment = engine.createExperiment({ defaultEmitters })
  }
  subscriptions = start(experiment)

  experiment.passengers.subscribe((passenger) => {
    io.emit('passenger', passenger.toObject())
  })

  setInterval(() => {
    io.emit('time', experiment.virtualTime.time())
  }, 1000)

  experiment.kommuner
    .pipe(
      mergeMap(({ id, dispatchedBookings, name, cars, co2 }) => {
        const totalBookings = dispatchedBookings.pipe(count(), startWith(0))

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
            totalCo2: totalCo2,
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

        const totalCars = cars.pipe(count(), startWith(0))

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
