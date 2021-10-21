import { useContext, useEffect, useRef } from 'react'
import { SocketIOContext } from '../context/socketIOContext'

export const useSocket = (eventKey, callback) => {
  const socket = useContext(SocketIOContext)
  const callbackRef = useRef(callback)

  callbackRef.current = callback

  const socketHandlerRef = useRef(function () {
    if (callbackRef.current) {
      callbackRef.current.apply(this, arguments)
    }
  })

  useEffect(() => {
    const subscribe = () => {
      if (eventKey) {
        socket.on(eventKey, socketHandlerRef.current)
      }
    }

    const unsubscribe = () => {
      if (eventKey) {
        socket.removeListener(eventKey, socketHandlerRef.current)
      }
    }

    subscribe()

    return unsubscribe
  }, [eventKey, socket])

  return { socket }
}
