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

  const [pink, setPink] = React.useState({
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
      ...newCars.map(({ id, tail, position }) => ({
        type: 'Feature',
        id,
        tail,
        geometry: { type: 'Point', coordinates: position },
      })),
    ]
    setCars(Object.assign({}, cars, { features }))
  })

  useSocket('pink', (newPink) => {
    const features = [
      ...pink.features.filter(
        (pink) => !newPink.some((nc) => nc.id === pink.id)
      ),
      ...newPink.map(({ id, tail, position }) => ({
        type: 'Feature',
        id,
        tail,
        geometry: { type: 'Point', coordinates: position },
      })),
    ]
    setPink(Object.assign({}, pink, { features }))
  })
  return (
    <>
      <Map data={{ postombud, cars, pink }} />
    </>
  )
}

export default App
