import React from 'react'
import io from 'socket.io-client'
import { SocketIOContext } from './socketIOContext'

export const SocketIOProvider = ({ url, opts, children }) => {
  const socketRef = React.useRef()

  if (typeof window === 'undefined') {
    return <>{children}</>
  }

  if (!socketRef.current) {
    socketRef.current = io(url, opts || {})
  }

  return (
    <SocketIOContext.Provider value={socketRef.current}>
      {children}
    </SocketIOContext.Provider>
  )
}
