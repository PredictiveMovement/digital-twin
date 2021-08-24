import React, { useState } from 'react'
import InfoBox from './components/InfoBox/index.js'
import { useSocket } from './hooks/useSocket.js'
import Map from './Map.js'
import Button from './components/Button/index.js'
import { PlayButton } from './components/PlaybackOptions/index.js'
import Loading from './components/Loading/index.js'

const App = () => {
  const [activeCar, setActiveCar] = useState(null)
  const [reset, setReset] = useState(false)

  useSocket('reset', () => {
    console.log('received reset')
    setBookings([])
    setCars([])
    setKommuner([])
    setPostombud([])
  })

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
    setBookings((bookings) => [
      ...bookings,
      ...newBookings.map(({ name, id, position, status, isCommercial, pickupDateTime, deliveredDateTime }) => ({
        id,
        address: name,
        status,
        isCommercial,
        position: [position.lon, position.lat],
        deliveredDateTime,
        pickupDateTime,
        deliveryTime: new Date(deliveredDateTime) - new Date(pickupDateTime)
      })),
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

  const [kommuner, setKommuner] = React.useState([])
  useSocket('kommun', (newKommuner) => {
    setKommuner((current) => current.concat(newKommuner))
  })

  const { socket } = useSocket()

  const Pause = () => {
    socket.emit('pause')
    console.log('pause stream')
  }

  const Play = () => {
    socket.emit('play')
    console.log('play stream')
  }

  const Reset = () => {
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
      <div style={{
        bottom: '80px',
        right: '200px',
        position: 'absolute'
      }}>
        <Button text={'Reset'} onClick={() => Reset()} />
      </div>
      {activeCar && <InfoBox data={activeCar} />}

      <PlayButton onPause={Pause} onPlay={Play}/>
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
