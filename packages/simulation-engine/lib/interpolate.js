function interpolatePositionFromRoute (route, time) {
  const currentTime = ((time - route.started) / 1000)
  const points = extractPoints(route)

  const futurePoints = points.filter(point => point.passed + point.duration > currentTime)
  const current = futurePoints[0]
  const next = futurePoints[1]

  if (!current || !next) return null

  const progress = (currentTime - current.passed) / current.duration
  // or
  // var progress = (currentTime - start.passed) / (end.passed - start.passed)
  const speed = Math.round(((current.meters) / 1000) / (current.duration / 60 / 60))

  const interpolatedPosition = {
    lat: current.position.lat + (next.position.lat - current.position.lat) * progress,
    lon: current.position.lon + (next.position.lon - current.position.lon) * progress,
    speed: speed,
    instruction: current,
    next: {
      lat: next.position.lat,
      lon: next.position.lon,
      instruction: next
    }
  }
  return interpolatedPosition
}

function extractPoints (route) {
  const annotation = route.legs
    .map(leg => leg.annotation)
    .reduce((a, b) => ({duration: a.duration.concat(b.duration), distance: b.distance.concat(b.distance)}))
  // destination is the last step, will not have an annotation
  annotation.distance.push(0)
  annotation.duration.push(0)

  const points = route.geometry.coordinates
    .map((pos, i) => ({ position: pos,
      meters: annotation.distance[i],
      duration: annotation.duration[i]
    }))

  points.reduce((passed, point) => {
    point.passed = passed
    return point.passed + (point.duration || 0)
  }, 0)

  return points
}

module.exports = {
  route: interpolatePositionFromRoute,
  points: extractPoints
}
