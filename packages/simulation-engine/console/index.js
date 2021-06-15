// const $hubs = require('../streams/postombud')

// const viewport = [
//     [12.789348659070175, 59.66324274595559],
//     [14.986614284069821, 60.48531682744461],
// ]

// function in_viewport(viewport, point) {
//     const [sw, ne] = viewport
//     const [west, south] = sw
//     const [east, north] = ne

//     return (
//         west <= point.lon && point.lon <= east
//         &&
//         south <= point.lat && point.lat <= north
//     )
// }

// $hubs
//     .filter(hub => in_viewport(viewport, hub.position))
//     .each(hub => console.log(hub))