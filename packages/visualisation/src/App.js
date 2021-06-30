import React, { useEffect } from 'react'
import { useContext } from "react";
import Map from './Map.js'

const App = () => {

  const [hubs, setHubs] = React.useState([])
  const [bookings, setBookings] = React.useState([])

  const [index, setIndex] = React.useState(0)
  const [cars, setCars] = React.useState([])

  useEffect(() => {
    fetch('http://localhost:4000/hubs')
      .then(res => res.json())
      .then(res => {
        setHubs(
          res.map(({ position }) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: { 'longitude': position.lon, 'latitude': position.lat } },
          })))
      });

    fetch('http://localhost:4000/bookings')
      .then(res => res.json())
      .then(res => {
        setBookings(
          res.map(({ departure }) => ({
            type: 'Feature',
            geometry: {
              type: 'Point', coordinates: { 'longitude': departure.lon, 'latitude': departure.lat }
            },
          }))
        )
      });

    fetch('http://localhost:4000/cars')
      .then(res => res.json())
      .then(res => {
        setCars(
          res.map(({ position, time }) => ({
            type: 'Feature',
            geometry: {
              type: 'Point', coordinates: [position.lon, position.lat]
            },
            time: time
          }))
        )
      });

  }, [])

  const [car, setCar] = React.useState([{
    type: 'Feature',
    geometry: {
      type: 'Point', coordinates: [15.798747, 61.865193]
    },
    time: 0,
  }])



  React.useEffect(() => {
    const timerId = setInterval(
      () => { setIndex(index => index + 1) },
      500
    );
    return () => clearInterval(timerId);
  }, []);

  React.useEffect(() => {
    console.log('we have', cars.length, 'cars', index)
    setCar([cars[index]]);
  }, [index]);

  // useSocket('test:debug', message => {
  //   console.debug(`test:debug: ${message}`)
  // })

  // useSocket('booking:backlog', (bookingBacklog) => {
  //   console.log('bookingBacklog', bookingBacklog)
  // })

  // useSocket('hubs:join', (newHubs) => {
  //   console.log(`received ${newHubs.length} hubs`)
  //   setHubs(
  //     newHubs.map(({ position }) => ({
  //       type: 'Feature',
  //       geometry: { type: 'Point', coordinates: { 'longitude': position.lon, 'latitude': position.lat } },
  //     }))
  //   )
  // })

  // useSocket('bookings:join', (newBookings) => {
  //   console.log(`received ${newBookings.length} bookings`)
  //   setBookings(
  //     newBookings.map(({ position }) => ({
  //       type: 'Feature',
  //       geometry: {
  //         type: 'Point', coordinates: { 'longitude': position.lon, 'latitude': position.lat }
  //       },
  //     }))
  //   )
  // })

  // useSocket('car:event', ({ event, ...car }) => {
  //   // console.debug('car:event', event, car)
  //   const idx = cars.findIndex(c => car.id === c.id)
  //   // if (idx < 0) {
  //   const newCars = [
  //     {
  //       type: 'Feature',
  //       geometry: { type: 'Point', coordinates: [car.position.lon, car.position.lat] },
  //     },
  //   ]
  //   setCars(newCars)

  //   // } else {
  //   //   setCars(
  //   //     cars.slice(0, idx),
  //   //     car,
  //   //     cars.slice(idx)
  //   //   )
  //   // }
  // })


  return (
    <>

      <Map
        data={{ hubs, bookings, car }}
      // onViewportChange={(viewport) => {
      //   socket.emit('viewport', viewport)
      // }}
      />

    </>
  )
}

export default App
