import React from 'react'
import { useContext } from "react";
import { SocketIOContext } from "./context/socketIOContext";
import Map from './Map.js'
import { useSocket } from './hooks/useSocket'

const App = () => {
  const socket = useContext(SocketIOContext);

  const [hubs, setHubs] = React.useState({
    type: 'FeatureCollection',
    features: [],
  })

  useSocket('hubs:join', (newHubs) => {
    const features = [
      ...newHubs.map(({ position }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [position.lon, position.lat] },
      })),
    ]
    setHubs(Object.assign({}, hubs, { features }))
  })


  return (
    <>
      <Map 
        data={{ hubs }} 
        onViewportChange={(viewport) => {
          socket.emit('viewport', viewport)
        }}
      />
    </>
  )
}

export default App
