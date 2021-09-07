import React, { useState } from 'react'
import InfoBox from './components/InfoBox/index.js'
import { useSocket } from './hooks/useSocket.js'
import Map from './Map.js'
import PlaybackOptions from './components/PlaybackOptions/index.js'
import Loading from './components/Loading/index.js'
import styled from 'styled-components'
import ResetIcon from './icons/reset.svg'
import TransparentButton from './components/TransparentButton/index.js'

const Wrapper = styled.div`
position: absolute;
z-index: 2;
bottom: 2.7rem;
left: 7rem;
`

const App = () => {
  const [activeCar, setActiveCar] = useState(null)
  const [reset, setReset] = useState(false)
  const [speed, setSpeed] = React.useState(60)

  useSocket('reset', () => {
    console.log('received reset')
    setBookings([])
    setCars([])
    setKommuner([])
    setPostombud([])
    socket.emit('speed', speed) // reset speed on server
  })

  function upsert(array, object, idProperty = 'id') {
    const index = array.findIndex(k => k[idProperty] === object[idProperty])
    if (index >= 0) {
      array[index] = { ...array[index], ...object }
    } else {
      array.push(object)
    }
    return array
  }
  
  const [cars, setCars] = React.useState([])
  useSocket('cars', (newCars) => {
    setReset(false)
    setCars((cars) => [
      ...cars.filter((car) => !newCars.some((nc) => nc.id === car.id)),
      ...newCars.map(({ id, heading, position, fleet, cargo, capacity }) => ({
        id,
        heading,
        position,
        fleet,
        cargo,
        capacity
      })),
    ])
  })

  const [bookings, setBookings] = React.useState([])
  useSocket('bookings', (newBookings) => {
    console.log('bookings: ', newBookings)
    setBookings((bookings) => newBookings
      .map(({ name, id, pickup, destination, status, isCommercial, deliveryTime, carId }) => ({
        id,
        address: name,
        status,
        isCommercial,
        pickup: [pickup.lon, pickup.lat],
        destination: [destination.lon, destination.lat],
        carId,
        deliveryTime
      }))
      .reduce((result, booking) => upsert(result, booking), bookings))
  })

  const [postombud, setPostombud] = React.useState([])
  useSocket('postombud', (newPostombud) => {
    setPostombud((current) => [
      ...current,
      ...newPostombud.map(({ id, operator, position }) => ({
        position: [position.lon, position.lat],
        operator,
        id,
      })),
    ])
  })

  const [kommuner, setKommuner] = React.useState([])
  useSocket('kommun', (kommun) => {
    console.log('kommun: ', kommun)
    setKommuner((current) => upsert(current, kommun, 'id'))
  })

  const { socket } = useSocket()

  const onPause = () => {
    socket.emit('pause')
    console.log('pause stream')
  }

  const onPlay = () => {
    socket.emit('play')
    console.log('play stream')
  }

  const onSpeedChange = (value) => {
    socket.emit('speed', value)
    setSpeed(value)
  }

  const resetSimulation = () => {
    setReset(true)
    socket.emit('reset')
    setBookings([])
    setCars([])
    setKommuner([])
    setPostombud([])
    setActiveCar(null)
  }



  return (
    <>
      <Wrapper>
        <TransparentButton onClick={() => resetSimulation()}>
          <img src={ResetIcon} alt='Reset' />
        </TransparentButton>
      </Wrapper>

      {activeCar && <InfoBox data={activeCar} />}

      <PlaybackOptions onPause={onPause} onPlay={onPlay} onSpeedChange={onSpeedChange} />
      {reset && <Loading />}
      <Map
        cars={cars}
        bookings={bookings}
        hubs={postombud}
        kommuner={kommuner}
        activeCar={activeCar}
        setActiveCar={setActiveCar}
      />
    </>
  )
}

export default App
