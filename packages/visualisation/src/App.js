import React, { useEffect } from 'react'
import Map from './Map.js'

const App = () => {
  const [hubs, setHubs] = React.useState([])
  const [bookings, setBookings] = React.useState([])
  const [carEvents, setCarEvents] = React.useState([])
  const [index, setIndex] = React.useState(0);
  const [car, setCar] = React.useState([{
    type: 'Feature',
    geometry: {
      type: 'Point', coordinates: [15.798747, 61.865193]
    },
    time: 0,
    event: "car:position"
  }])
  const CAR_SPEED = 100;

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
        setCarEvents(
          res.map(({ position, time, event, booking_id }) => ({
            type: 'Feature',
            geometry: {
              type: 'Point', coordinates: [position.lon, position.lat]
            },
            event,
            time,
            bookingId: booking_id
          }))
        )
      });

  }, [])

  useEffect(() => {
    let timeout;
    if (index < carEvents.length - 1) {
      setCar([carEvents[index]])

      let timeUntilNext = (carEvents[index + 1].time - carEvents[index].time) * CAR_SPEED;
      if (carEvents[index].event === 'car:pickup') {
        console.log('car is picking up a package', carEvents[index].bookingId)
        const PICKUP_DELAY = 5 // should probably come from data in the future
        timeUntilNext += PICKUP_DELAY * CAR_SPEED
      }

      timeout = setTimeout(() => setIndex(index + 1), timeUntilNext);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [index, carEvents]);

  return (
    <>
      <Map
        data={{ hubs, bookings, car }}
      />
    </>
  )
}

export default App
