import React from 'react'
import Map from './Map.js'
import { useSocket } from './hooks/useSocket'

const DELAY_MS = 15000

function interpolatePositionFromTail(tail, time) {
  const next = tail.filter((point) => point[2] > time)[0]
  const current = tail[tail.indexOf(next) - 1]
  if (!current || !next) return next
  const progress = (time - current[2]) / (next[2] - current[2])
  const speed = Math.round(current[3])
  return [
    current[0] + (next[0] - current[0]) * progress,
    current[1] + (next[1] - current[1]) * progress,
    time,
    speed,
  ]
}
const App = () => {
  const [postombud, setPostombud] = React.useState({
    type: 'FeatureCollection',
    features: [],
  })

  const [cars, setCars] = React.useState({
    type: 'FeatureCollection',
    features: [],
  })
  const [poll, setPoll] = React.useState(null)

  useSocket('postombud', (newPostombud) => {
    const features = [
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

  const interpolate = () => {
    setCars(
      Object.assign({}, cars, {
        features: cars.features.map(
          (car) =>
            (car.coordinates =
              interpolatePositionFromTail(car.tail, Date.now() - DELAY_MS) ||
              car.coordinates)
        ),
      })
    )
    clearTimeout(poll)
    setPoll(setTimeout(() => interpolate(), 500))
  }

  return (
    <>
      <Map data={postombud} />
    </>
  )
}

export default App
