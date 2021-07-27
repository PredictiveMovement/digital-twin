import React from 'react'
import Map from './Map.js'
import { useSocket } from './hooks/useSocket'

const App = () => {
  const [postombud, setPostombud] = React.useState({
    type: 'FeatureCollection',
    features: [],
  })

  const [cars, setCars] = React.useState({
    type: 'FeatureCollection',
    features: [],
  })

  const [bookings, setBookings] = React.useState({
    type: 'FeatureCollection',
    features: [],
  })

  useSocket('postombud', (newPostombud) => {
    const features = [
      ...postombud.features.filter(
        (ombud) => !newPostombud.some((np) => np.id === ombud.id)
      ),
      ...newPostombud.map(({ position }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [position.lon, position.lat] },
      })),
    ]
    setPostombud(Object.assign({}, postombud, { features }))
  })

  useSocket('cars', (newCars) => {
    const features = [
      ...cars.features.filter((car) => !newCars.some((nc) => nc.id === car.id)),
      ...newCars.map(({ id, heading, position }) => ({
        type: 'Feature',
        id,
        heading,
        geometry: { type: 'Point', coordinates: position },
      })),
    ]
    setCars(Object.assign({}, cars, { features }))
  })

  useSocket('bookings', (newBookings) => {
    const features = [
      ...bookings.features,
      ...newBookings.map(({ position }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [position.lon, position.lat] },
      })),
    ]
    console.log({ features })
    setBookings(Object.assign({}, bookings, { features }))
  })

  return (
    <>
      <Map postombud={postombud} cars={cars} bookings={bookings} />
    </>
  )
}

export default App
