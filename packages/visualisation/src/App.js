import React, { useState } from 'react'
import { useSocket } from './hooks/useSocket.js'
import Map from './Map.js'
import PlaybackOptions from './components/PlaybackOptions/index.js'
import Loading from './components/Loading/index.js'
import styled from 'styled-components'
import ResetIcon from './icons/reset.svg'
import TransparentButton from './components/TransparentButton/index.js'
import SideMenu from './components/SideMenu/index.js'
import WelcomeBox from './components/WelcomeBox/index.js'

const Wrapper = styled.div`
  position: absolute;
  z-index: 2;
  bottom: 2.7rem;
  left: 10rem;
`

const App = () => {
  const [activeCar, setActiveCar] = useState(null)
  const [reset, setReset] = useState(false)
  const [speed, setSpeed] = React.useState(60)
  const [time, setTime] = React.useState(Date.now())

  useSocket('reset', () => {
    console.log('received reset')
    setBookings([])
    setCars([])
    setKommuner([])
    setPostombud([])
    setBusStops([])
    socket.emit('speed', speed) // reset speed on server
  })

  function upsert(array, object, idProperty = 'id') {
    const current = array.find((k) => k[idProperty] === object[idProperty])
    if (current) {
      Object.assign(current, object)
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
      ...newCars.map(
        ({
          id,
          heading,
          bearing,
          position,
          fleet,
          cargo,
          capacity,
          lineNumber,
        }) => ({
          id,
          heading,
          bearing,
          position,
          fleet,
          cargo,
          capacity,
          lineNumber,
        })
      ),
    ])
  })

  useSocket('time', (time) => {
    setTime(time)
  })

  const [bookings, setBookings] = React.useState([])
  useSocket('bookings', (newBookings) => {
    setBookings((bookings) => [
      ...bookings.filter(
        (booking) => !newBookings.some((nb) => nb.id === booking.id)
      ),
      ...newBookings.map(
        ({
          name,
          id,
          pickup,
          destination,
          status,
          isCommercial,
          deliveryTime,
          carId,
          co2,
          cost,
        }) => ({
          id,
          address: name,
          status,
          co2,
          cost,
          isCommercial,
          pickup: [pickup.lon, pickup.lat],
          destination: [destination.lon, destination.lat],
          carId,
          deliveryTime,
        })
      ),
    ])
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

  const [busStops, setBusStops] = React.useState([])
  useSocket('busStops', ({ position, name }) => {
    setBusStops((current) => [
      ...current,
      {
        name,
        position: [position.lon, position.lat].map((s) => parseFloat(s)),
      },
    ])
  })

  const [kommuner, setKommuner] = React.useState([])
  useSocket('kommun', (kommun) => {
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
    setBusStops([])
    setActiveCar(null)
  }

  return (
    <>
      <WelcomeBox />
      <Wrapper>
        <TransparentButton onClick={() => resetSimulation()}>
          <img src={ResetIcon} alt="Reset" />
        </TransparentButton>
      </Wrapper>
      <SideMenu />

      <PlaybackOptions
        onPause={onPause}
        onPlay={onPlay}
        onSpeedChange={onSpeedChange}
      />
      {reset && <Loading />}
      <Map
        cars={cars}
        bookings={bookings}
        hubs={postombud}
        busStops={busStops}
        kommuner={kommuner}
        activeCar={activeCar}
        time={time}
        setActiveCar={setActiveCar}
      />
    </>
  )
}

export default App
