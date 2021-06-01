import React, { useState } from 'react'
import ReactMapGL, { Layer, Source } from 'react-map-gl'
import { useSocket } from "use-socketio";

const DELAY_MS = 15000

function interpolatePositionFromTail (tail, time) {
  const next = tail.filter(point => point[2] > time)[0]
  const current = tail[tail.indexOf(next)-1]
  if (!current || !next) return next
  const progress = (time - current[2]) / (next[2]-current[2])
  const speed = Math.round(current[3])
  return [current[0] + (next[0] - current[0]) * progress, current[1] + (next[1] - current[1]) * progress, time, speed]
}

const Map = () => {
  const [mapState, setMapState] = useState({
    viewport: {
      latitude: 61.8294925,
      longitude: 16.0565493,
      zoom: 8,
      pitch: 40
    },
  })
  const [cars, setCars] = useState({
    type: 'FeatureCollection',
    features: []
  })
  const [poll, setPoll] = useState(null)

  const { socket, subscribe, unsubscribe } = useSocket("cars", newCars => {
    const features = [...cars.features.filter(car => !newCars.some(nc => nc.id === car.id)), ...newCars.map(({id, tail, position}) => (
      { type: 'Feature', id, tail, geometry: {type: 'Point', coordinates: [position[0], position[1]]}}
    ))]
    console.log('cars', cars)
    setCars(Object.assign({}, cars, {features}))
  })

  const interpolate = () => {
    setCars(Object.assign({}, cars, {features:
      cars.features.map(car => car.coordinates = interpolatePositionFromTail(car.tail, Date.now() - DELAY_MS) || car.coordinates)
    }))
    clearTimeout(poll)
    setPoll(setTimeout(() => interpolate(), 500))
  }

  return (
    <div>
      <ReactMapGL
        width="100%"
        height="100vh"
        mapStyle="mapbox://styles/mapbox/dark-v10"
        {...mapState.viewport}
        onViewportChange={viewport => setMapState({ viewport })}
      >
       <Source id="my-data" type="geojson" data={cars}>
          <Layer
            id="point"
            type="circle"
            paint={{
              'circle-radius': 10,
              'circle-color': '#007cbf'
            }} />
        </Source>
      </ReactMapGL>
    </div>
  )
}

export default Map
