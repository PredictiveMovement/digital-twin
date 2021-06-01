import React from 'react'
import Map from './Map.js'
import { SocketIOProvider } from 'use-socketio'

const App: React.FC = () => {
  const options = {

  }

  return (
    <SocketIOProvider url="http://localhost:4000" opts={options}>
      <Map />
    </SocketIOProvider>
  )
}

export default App
