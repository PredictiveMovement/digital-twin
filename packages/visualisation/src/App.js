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
    console.log('got postombud', newPostombud)
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
    console.log('postombud', postombud)
  })

  useSocket('cars', (newCars) => {
    // console.log('got cars', newCars.length)
    const features = [
      ...cars.features.filter((car) => !newCars.some((nc) => nc.id === car.id)),
      ...newCars.map(({ id, tail, position }) => ({
        type: 'Feature',
        id,
        tail,
        geometry: { type: 'Point', coordinates: position },
      })),
    ]
    setCars(Object.assign({}, cars, { features }))
    console.log('cars', cars)
  })

  return (
    <>
      <Map data={{ postombud, cars }} />
    </>
  )
}

export default App
