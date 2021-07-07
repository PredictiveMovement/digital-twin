import React, { useState, useEffect } from 'react'
import Map from './Map.js'


function interpolatedPosition(fromEvent, toEvent, time) {
  const weHaveBeenDrivingFor = (time - fromEvent.time)
  const progress = weHaveBeenDrivingFor / fromEvent.duration

  const interpolatedPosition = {
    latitude: fromEvent.geometry.coordinates.latitude * (1 - progress) + toEvent.geometry.coordinates.latitude * progress,
    longitude: fromEvent.geometry.coordinates.longitude * (1 - progress) + toEvent.geometry.coordinates.longitude * progress,
  }
  return interpolatedPosition
}

const App = () => {
  const [hubs, setHubs] = useState([])
  const [bookings, setBookings] = useState([])
  const [carEvents, setCarEvents] = useState({})
  const [index, setIndex] = useState(0);

  const [currentCarPositions, setCurrentCarPositions] = useState({})

  const CAR_MS_PER_S = 50;

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
              type: 'Point', coordinates: { 'longitude': destination.lon, 'latitude': destination.lat }
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

    fetch('http://localhost:4000/car_events')
      .then(res => res.json())
      .then(res => {
        console.log("got cars", res)
        const result = {}
        res.forEach(({ car_id, position, time, type, booking_id, meters, duration }) => {
          if (result[car_id] == null) result[car_id] = []

          result[car_id].push({
            type: 'Feature',
            geometry: {
              type: 'Point', coordinates: { 'longitude': position.lon, 'latitude': position.lat }
            },
            eventType: type,
            time,
            duration,
            bookingId: booking_id,
            carId: car_id,
            meters
          })
        })
        setCarEvents(result)
        setCurrentCarPositions(
          Object.entries(result).reduce(
            (acc, [carId, events]) => (
              { ...acc, [carId]: { ...events[0], index: 0 } }
            ),
            {}
          ),
        )
      });

  }, [])

  // useEffect(() => {
  //   let timeout;
  //   if (index <= carEvents.length - 1) {
  //     const event = carEvents[index]
  //     setCurrentCarPositions({
  //       ...currentCarPositions,
  //       [event.carId]: event
  //     })

  //     let timeUntilNext = index === carEvents.length - 1
  //       ? 0
  //       : (carEvents[index + 1].time - carEvents[index].time) * CAR_MS_PER_S
  //     if (carEvents[index].eventType === 'car:pickup') {
  //       console.log('car is picking up a package', carEvents[index].bookingId)
  //       const PICKUP_DELAY = 5 // should probably come from data in the future
  //       timeUntilNext += PICKUP_DELAY * CAR_MS_PER_S
  //     } else if (carEvents[index].eventType === 'car:deliver') {
  //       console.log('car is delivering up a package', carEvents[index].bookingId)
  //       const DELIVER_DELAY = 8 // should probably come from data in the future
  //       timeUntilNext += DELIVER_DELAY * CAR_MS_PER_S
  //     }

  //     timeout = setTimeout(() => setIndex(index + 1), timeUntilNext);
  //   }

  //   return () => {
  //     clearTimeout(timeout);
  //   };
  // }, [index, carEvents, currentCarPositions]);

  useEffect(() => {
    const startTime = (new Date()).getTime()
    function onFrame() {
      const SPEED = 7
      if (Object.keys(carEvents).length === 0) return

      const currentTime = (new Date()).getTime()
      const elapsed = (currentTime - startTime) * SPEED
      //console.log('elapsed', elapsed)

      setCurrentCarPositions(currentPositions => {
        const changes = {}

        Object.entries(carEvents).forEach(([carId, events]) => {
          const currentEvent = currentPositions[carId]
          if (currentEvent.isStopped) {
            console.log('STOPPPPP')
            return null;
          }

          if (currentEvent.eventType === 'car:pickup') {
            console.log('car is picking up a package', currentEvent.bookingId)
          } else if (currentEvent.eventType === 'car:deliver') {
            console.log('car is delivering up a package', currentEvent.bookingId)
          }

          if (elapsed <= (currentEvent.time + currentEvent.duration) * 1000) {
            const nextEvent = events[currentEvent.index + 1]
            if (nextEvent != null) {
              const position = interpolatedPosition(currentEvent, nextEvent, elapsed / 1000)
              // [next_event.carId]: interpolated_position(previous_event, next_event)
              changes[currentEvent.carId] = {
                ...currentEvent,
                geometry: {
                  type: 'Point', coordinates: position
                }
              }
            }
          } else {
            const nextEvent = events[currentEvent.index + 1]
            if (nextEvent != null) {
              // console.log(`increasing event index for car:${nextEvent.carId} from:${currentEvent.index} to:${currentEvent.index + 1}`)
              // console.log('next event', nextEvent)
              changes[nextEvent.carId] = {
                ...nextEvent,
                index: currentEvent.index + 1,
                geometry: {
                  type: 'Point',
                  coordinates: nextEvent.geometry.coordinates
                }

              }
            } else {
              changes[currentEvent.carId] = {
                ...currentEvent,
                isStopped: true,
              }
            }
          }

        })

        return { ...currentPositions, ...changes }
      })
      requestAnimationFrame(onFrame)
    }
    requestAnimationFrame(onFrame)
  }, [carEvents])

  return (
    <>
      <Map
        data={{ hubs, bookings, car: Object.values(currentCarPositions) }}
      />
    </>
  )
}

export default App
