require('dotenv').config()

const { env } = require('process');
const routes = require('./routes')
const port = env.PORT || 4000
const engine = require('../index');
const { vehicleTypes } = require('../lib/vehicles/vehicleTypes');
const { lastValueFrom, timer } = require('rxjs');
const { toArray, takeUntil, mergeMap, filter } = require('rxjs/operators')

const planRequest = ({vehicles, bookings}) => (
{
  vehicles: vehicles.map(({id, type, position, capacity, cargo}) => (
    {
      vehicle_id: id,
      type_id: type,
      start_address: position,
      max_jobs: capacity - cargo.length
    }
  )),
  vehicle_types: Object.entries(vehicleTypes).map(([key, {capacity, profile}]) => (
    {
      type_id: key,
      capacity: [
        capacity
      ],
      profile
    }
  )),
  shipments: bookings.map(({id, pickup: {position: pickupPosition}, destination: {position: destinationPosition}}) => ({
    id,
    pickup: {
      location_id: pickupPosition.id,
      lon: pickupPosition.lon,
      lat: pickupPosition.lat
    },
    delivery: {
      location_id: destinationPosition.id,
      lon: destinationPosition.lon,
      lat: destinationPosition.lat      
    },
    size: [
      1
    ],
  })),
  objectives: [
    {
      type: 'min',
      value: 'transport_time'
    },
  ],
})

const ok = function (req, res) {
  engine.kommuner.pipe(takeUntil(
    timer(300)), 
    mergeMap(async kommun => {
      const vehicles = await lastValueFrom(kommun.vehicles.pipe(takeUntil(timer(30)), toArray()))
      const bookings = await lastValueFrom(kommun.dispatchedBookings.pipe(takeUntil(timer(30)), toArray()))
      return planRequest({vehicles, bookings})

    }),
    filter(plan => plan.shipments.length),
    toArray()
  ).subscribe( kommuner => {
    res.writeHead(200)
    res.end(JSON.stringify(kommuner, null, 2))
  })
}

const server = require('http').createServer(ok)

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

server.listen(port)
routes.register(io)
