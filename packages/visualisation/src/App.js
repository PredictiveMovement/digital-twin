import React, { useState, useEffect } from 'react'
import Map from './Map.js'

function interpolatePosition(fromEvent, toEvent, time) {
  const weHaveBeenDrivingFor = (time - fromEvent.time)
  const progress = Math.min(weHaveBeenDrivingFor / fromEvent.duration, 1)
  console.log(progress)

  const interpolatedPosition = {
    latitude: fromEvent.position.lat * (1 - progress) + toEvent.position.lat * progress,
    longitude: fromEvent.position.lon * (1 - progress) + toEvent.position.lon * progress,
  }
  return interpolatedPosition
}

const App = () => {
  const [hubs, setHubs] = useState([])
  const [bookings, setBookings] = useState([])
  const [carEvents, setCarEvents] = useState([])
  //const [carEventIndex, setCarEventIndex] = useState(0);

  const [currentCarPositions, setCurrentCarPositions] = useState({})

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
        setCarEvents(
          res
          // .filter(({car_id}) => car_id === 'car-pink-2')
          .map(({ car_id, position, time, type, booking_id, meters, duration }) => ({
            position,
            eventType: type,
            time,
            duration,
            bookingId: booking_id,
            carId: car_id,
            meters
          })
        ))
      })

  }, [])

  useEffect(() => {
    const startTime = (new Date()).getTime()
    // TODO: maybe these should be handled via react somehow,
    // some times I get two instances of the simulation running at the same time but maybe that's due to the dev move
    let carEventIndex = 0
    let currentCarWaypoints = {}

    function onFrame() {
      const SPEED = 1 // * the actual speed
      const areEventsLeft = () => (carEventIndex < carEvents.length)
      // TODO: why are we only processing 592 events when 615 are returned from api? bug?
      if (!areEventsLeft()) {
        console.log('Reached end of carEvents, doing nothing')
        return null
      }
      const currentTime = (new Date()).getTime()
      const elapsed = ((currentTime - startTime) / 1000) * SPEED

      setCurrentCarPositions(currentPositions => {
        // make list of all events to be processed
        let currentEvents = []
        // TODO: make a function for this
        while (areEventsLeft() && elapsed >= carEvents[carEventIndex].time) {
          currentEvents.push(carEvents[carEventIndex])
          ++carEventIndex
        }

        // iterate over those new events and update car waypoints
        currentEvents.forEach(event => {
          switch (event.eventType) {
            case 'car:position':
              // car has reached next waypoint
              const oldWaypoints = currentCarWaypoints[event.carId]
              if (oldWaypoints === undefined) { // first time we see this car just make it appear
                currentCarWaypoints[event.carId] = { from: event, to: event }
              } else { // change were it's going
                currentCarWaypoints[event.carId] = { from: oldWaypoints.to, to: event }
              }
              break;
            case 'car:pickup':
              console.log('car is picking up package', event.bookingId)
              break;
            case 'car:deliver':
              console.log('car is delivering package', event.bookingId)
              // // console.log('event ======> ', event)
              // console.log('bookings ===> ', bookings)
              //debugger
              break;
            default:
              console.error('Error unknown eventType', event)
          }
        })

        // move cars according to their waypoints and current time
        const changes = Object.fromEntries(Object.entries(currentCarWaypoints).map(([carName, car]) =>
          [
            carName, 
            { geometry: { type: 'Point', coordinates: interpolatePosition(car.from, car.to, elapsed) } }
          ]
        ))
        return { ...currentPositions, ...changes }
      })
      requestAnimationFrame(onFrame)
    }
    requestAnimationFrame(onFrame)
  }, [carEvents])

  return (
    <>
      <Map
        data={{ hubs, bookings, car: Object.values(currentCarPositions), totalCars: Object.values(currentCarPositions).length }}
      />
    </>
  )
}

export default App
