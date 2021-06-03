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
  useSocket('postombud', (newPostombud) => {
    const features = [
      ...postombud.features.filter(
        (ombud) => !newPostombud.some((np) => np.id === ombud.id)
      ),
      ...newPostombud.map(({ position }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [position[0], position[1]] },
      })),
    ]
    setPostombud(Object.assign({}, postombud, { features }))
  })

  useSocket('cars', (newCars) => {
    const features = [
      ...cars.features.filter((car) => !newCars.some((nc) => nc.id === car.id)),
      ...newCars.map(({ id, tail, position }) => ({
        type: 'Feature',
        id,
        tail,
        geometry: { type: 'Point', coordinates: [position[0], position[1]] },
      })),
    ]
    setCars(Object.assign({}, cars, { features }))
  })

  return (
    <>
      <Map data={postombud} />
    </>
  )
}

export default App
