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
  const CAR_SPEED = 40;

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
          res.map(({ departure, destination }) => ({
            type: 'Feature',
            geometry: {
              type: 'Point', coordinates: { 'longitude': departure.lon, 'latitude': departure.lat }
            },
            destination: {
              coordinates: {
                'longitude': destination.lon,
                'latitude': destination.lat
              }
            }
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
      const timeUntilNext = (cars[index + 1].time - cars[index].time) * CAR_SPEED;
      timeout = setTimeout(() => setIndex(index + 1), timeUntilNext);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [index, cars]);

  return (
    <>
      <Map
        data={{ hubs, bookings, car }}
      />
    </>
  )
}

export default App
