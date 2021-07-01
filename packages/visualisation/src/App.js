import React, { useEffect } from 'react'
import Map from './Map.js'

const App = () => {

  const [hubs, setHubs] = React.useState([])
  const [bookings, setBookings] = React.useState([])
  const [cars, setCars] = React.useState([])
  const [index, setIndex] = React.useState(0);
  const [car, setCar] = React.useState([{
    type: 'Feature',
    geometry: {
      type: 'Point', coordinates: [15.798747, 61.865193]
    },
    time: 0,
    event: "car:position"
  }])
  const speed = 10;

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
          res.map(({ position, time, event }) => ({
            type: 'Feature',
            geometry: {
              type: 'Point', coordinates: [position.lon, position.lat]
            },
            time,
            event
          }))
        )
      });

  }, [])

  useEffect(() => {
    let timeout;
    if (index < cars.length - 1) {
      setCar([cars[index]])
      const timeUntilNext = (cars[index + 1].time - cars[index].time) * speed;
      timeout = setTimeout(() => setIndex(index + 1), timeUntilNext);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [index, cars]);


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
