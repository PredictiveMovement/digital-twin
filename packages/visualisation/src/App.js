import React, { useState, useEffect } from 'react'
import Map from './Map.js'


// TODO: decouple events, waypoints and geometry from each other, it's all a mess right now
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
        // TODO: do we really want to map or this potentially huuuuuge array?
        // we will still loop over it later to process it, we could create the geometry then
        setCarEvents(
          res.map(({ car_id, position, time, type, booking_id, meters, duration }) => ({
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
        ))
      })

  }, [])


  // const [index, setIndex] = useState(0);
  // const CAR_MS_PER_S = 50;
  //
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
    let carEventIndex = 0
    let currentCarWaypoints = {}

    function onFrame() {
      const SPEED = 7
      console.log('carEventIndex:', carEventIndex, ', carEvents.length:', carEvents.length)
      const eventsLeft = () => (carEventIndex < carEvents.length)
        // TODO: why are we only processing 592 events when 615 are returned from api? bug?
      if (!eventsLeft()) {
        console.log('Reached end of carEvents, doing nothing')
        return null
      }
      const currentTime = (new Date()).getTime()
      const elapsed = ((currentTime - startTime) / 1000) * SPEED

      setCurrentCarPositions(currentPositions => {
        const changes = {}

        // make list of all event to be processed
        let currentEvents = []

        while (eventsLeft() && elapsed >= carEvents[carEventIndex].time) {
          currentEvents.push(carEvents[carEventIndex])
          //setCarEventIndex(carEventIndex => carEventIndex+1)
          ++carEventIndex
        }
        //console.log('curretnEvents', currentEvents)
        // iterate over those events and update cars (and other state)
        currentEvents.forEach(event => {
          switch (event.eventType) {
            case 'car:position':
              // car has reached next waypoint
              const oldWaypoints = currentCarWaypoints[event.carId]
              if (oldWaypoints == undefined) { // first time we see this car just make it appear
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
              break;
            default:
              console.error('Error unknown eventType', event)
          }
        })

        // TODO: work here!
        // iterate over all cars and tell them to move according to their state and current time
        // Object.fromEntries(Object.entries(foo).map(([name, val]) => [name, val*2]))
        // TODO: map currentCarWaypoints into changes½!
        Object.entries(currentCarWaypoints).forEach(([carName, car]) => {
          const position = interpolatedPosition(car.from, car.to, elapsed)
          changes[carName] = {
            ...car.from, // TODO: what's even in here? do we really need it?
            geometry: {
              type: 'Point', coordinates: position
            }
          }
        })

        /*
        currentEvents.forEach(([carId, events]) => {
          const currentEvent = currentPositions[carId]
          if (currentEvent.isStopped) {
            return null;
          }

          if (currentEvent.eventType === 'car:pickup') {
            console.log('car is picking up a package', currentEvent.bookingId)
          } else if (currentEvent.eventType === 'car:deliver') {
            console.log('car is delivering up a package', currentEvent.bookingId)
          }

*/
          /* if (elapsed <= (currentEvent.time + currentEvent.duration) * 1000) {
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
          } */

 //       })

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
