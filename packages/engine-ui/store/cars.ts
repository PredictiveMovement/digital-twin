import io from 'socket.io-client'
import _ from 'highland'

export default _(function(push, next) {
  const socket = io.connect('http://localhost:4000')
  socket.on('cars', (car: any) => {
    push(null, car)
    next()
  })
})
