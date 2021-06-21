import React from 'react'
import { useContext } from "react";
import { SocketIOContext } from "./context/socketIOContext";
import Map from './Map.js'
import { useSocket } from './hooks/useSocket'

const App = () => {
  const socket = useContext(SocketIOContext);

  const [hubs, setHubs] = React.useState({
    type: 'FeatureCollection',
    features: [],
  })
  const [bookings, setBookings] = React.useState({
    type: 'FeatureCollection',
    features: [],
  })

  const [cars, setCars] = React.useState([

    {
      "type": "Feature",
      "geometry": {
        "coordinates": [
          16.059734545454543,
          61.821003030303025
        ],
        "type": 'Point',

      },
    },
  ]
  )


  useSocket('hubs:join', (newHubs) => {
    console.log(`received ${newHubs.length} hubs`)
    const features = [
      ...newHubs.map(({ position }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: { longitude: position.lon, latitude: position.lat } },
      })),
    ]
    setHubs(Object.assign({}, hubs, { features }))
  })

  useSocket('bookings:join', (newBookings) => {
    console.log(`received ${newBookings.length} bookings`)
    const features = [

      ...newBookings.map(({ position }) => ({

        type: 'Feature',
        geometry: {
          type: 'Point', coordinates: { 'longitude': position.lon, 'latitude': position.lat }
        },
      })),
    ]
    setBookings(Object.assign({}, bookings, { features: bookings.features.concat(features) }));
  })

  useSocket('car:event', ({ event, ...car }) => {
    const idx = cars.findIndex(c => car.id === c.id)
    // if (idx < 0) {
    const newCars = [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: { 'longitude': car.position.lon, 'latitude': car.position.lat } },
      },
    ]
    setCars(newCars)

    // } else {
    //   setCars(
    //     cars.slice(0, idx),
    //     car,
    //     cars.slice(idx)
    //   )
    // }
    console.debug('car:event', car)
  })


  return (
    <>
      <Map
        data={{ hubs, bookings, cars: { type: 'FeatureCollection', features: cars } }}
        onViewportChange={(viewport) => {
          socket.emit('viewport', viewport)
        }}
      />
    </>
  )
}

export default App
