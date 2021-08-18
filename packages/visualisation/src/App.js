import React from 'react'
import { useSocket } from './hooks/useSocket.js'
import Map from './Map.js'
import Button from './components/Button/index.js'

const App = () => {

  useSocket('reset', () => {
    console.log('received reset')
    setBookings([])
    setCars([])
    setKommuner([])
    setPostombud([])
  })

  const [cars, setCars] = React.useState([])
  useSocket('cars', (newCars) => {

    setCars(cars => [
      ...cars.filter((car) => !newCars.some((nc) => nc.id === car.id)),
      ...newCars.map(({ id, heading, position }) => ({
        id,
        heading,
        position,
      })),
    ])
  })

  const [bookings, setBookings] = React.useState([])
  useSocket('bookings', (newBookings) => {
    setBookings(bookings => [
      ...bookings,
      ...newBookings.map(({ name, id, position, status, isCommercial }) => ({
        id,
        address: name,
        status,
        isCommercial,
        position: [position.lon, position.lat]
      }))
    ])
  })

  const [postombud, setPostombud] = React.useState([])
  useSocket('postombud', (newPostombud) => {
    setPostombud(current => [
      ...current,
      ...newPostombud.map(({ id, operator, position }) => ({
        position: [position.lon, position.lat],
        operator,
        id,
      }))
    ])
  })


  const [kommuner, setKommuner] = React.useState([])
  useSocket('kommun', newKommuner => {
    setKommuner(current => current.concat(newKommuner))
  })

  // const { socket } = useSocket()

  // const Reset = () => {
  //   socket.emit('reset')
  //   setBookings([])
  //   setCars([])
  //   setKommuner([])
  //   setPostombud([])
  // }

  return (
    <>
      {/* <Button text={'Reset'} onClick={() => Reset()} /> */}
      <Map cars={cars} bookings={bookings} hubs={postombud} kommuner={kommuner} />
    </>
  )
}

export default App
