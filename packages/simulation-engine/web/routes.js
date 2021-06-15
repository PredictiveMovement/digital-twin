const _ = require('highland')
const $hubs = require('../streams/postombud')

const viewport = [
    [12.789348659070175, 59.66324274595559],
    [14.986614284069821, 60.48531682744461],
]

function in_viewport(viewport, point) {
    const [sw, ne] = viewport
    const [west, south] = sw
    const [east, north] = ne

    return (
        west <= point.lon && point.lon <= east
        &&
        south <= point.lat && point.lat <= north
    )
}


function register(io) {
  io.on('connection', function (socket) {
    console.debug('connection')
    
    socket.on('viewport', (viewport) => {
      console.debug('ye', viewport)

      $hubs()
          .filter(hub => in_viewport(viewport, hub.position))
          .map(hub => ({type: 'hub', position: hub.position, id: hub.id}))
          .toArray(hubs => {
            socket.emit('hubs:join', hubs)
          })
    })
  })
}

module.exports = {
  register,
}
