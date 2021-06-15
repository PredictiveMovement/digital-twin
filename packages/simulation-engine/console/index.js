const $hubs = require('../streams/postombud')

const viewport = [[0.0, 61.0], [19.0, 15.0]]

function in_viewport(viewport, point) {
    const [upper_left, lower_right] = viewport
    const [top_left_lon, top_left_lat] = upper_left
    const [bottom_right_lon, bottom_right_lat] = lower_right
    const longitude_is = (
        top_left_lon <= point.lon && point.lon <= bottom_right_lon
    )
    const latitude_is = (
        bottom_right_lat <= point.lat && point.lat <= top_left_lat
    )

    // console.debug(point, upper_left, lower_right, longitude_is, latitude_is)
    return longitude_is && latitude_is
}

$hubs
    .filter(hub => in_viewport(viewport, hub.position))