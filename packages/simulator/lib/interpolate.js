function interpolatePositionFromRoute(
  routeStarted,
  time,
  remainingPointsInRoute
) {
  const timeSinceRouteStarted = (time - routeStarted) / 1000

  if (routeStarted > time) {
    // route.started > time happens when a "reset" is triggered
    return {
      lat: remainingPointsInRoute[0].position.lat,
      lon: remainingPointsInRoute[0].position.lon,
      speed: 0,
      instruction: remainingPointsInRoute[0],
      next: remainingPointsInRoute[0],
      remainingPoints: [],
      skippedPoints: [],
    }
  }

  const futurePoints = remainingPointsInRoute.filter(
    (point) => point.passed + point.duration > timeSinceRouteStarted
  )
  const nrOfPointsSkipped = remainingPointsInRoute.indexOf(futurePoints[0]) + 1
  const skippedPoints = remainingPointsInRoute.slice(0, nrOfPointsSkipped)
  const current = futurePoints[0]
  const next = futurePoints[1]
  const lastPoint = remainingPointsInRoute[remainingPointsInRoute.length - 1]
  const remainingPoints = futurePoints

  // when we reach the end
  if (!current || !next)
    return {
      lat: lastPoint.position.lat,
      lon: lastPoint.position.lon,
      speed: 0,
      instruction: lastPoint,
      next: null,
      remainingPoints,
      skippedPoints: [],
    }

  const progress = (timeSinceRouteStarted - current.passed) / current.duration
  // or
  // var progress = (timeSinceRouteStarted - start.passed) / (end.passed - start.passed)
  const speed = Math.round(current.meters / 1000 / (current.duration / 60 / 60))

  const interpolatedPosition = {
    lat:
      current.position.lat +
      (next.position.lat - current.position.lat) * progress,
    lon:
      current.position.lon +
      (next.position.lon - current.position.lon) * progress,
    speed: speed,
    instruction: current,
    next: {
      lat: next.position.lat,
      lon: next.position.lon,
      instruction: next,
    },
    skippedPoints,
    remainingPoints,
  }
  return interpolatedPosition
}

const speedFactor = 1.4 // apply this to all speeds, TODO: Investigate ways to get buses to start position faster other ways. With speedFactor this high we greatly reduce the number of buses that get unassigned because it missed the first stop time due to too slowly navigating from bus depots to first stop. Might be improved by improving knowledge about the Swedish road network in OSRM/OSM (speeds might not be correct for roads in sweden)

function extractPoints(route) {
  const annotation = route.legs
    .map((leg) => leg.annotation)
    .reduce((a, b) => ({
      duration: a.duration.concat(b.duration) / speedFactor,
      distance: b.distance.concat(b.distance),
    }))
  // destination is the last step, will not have an annotation
  annotation.distance.push(0)
  annotation.duration.push(0)

  const points = route.geometry.coordinates.map((pos, i) => ({
    position: pos,
    meters: annotation.distance[i],
    duration: annotation.duration[i],
  }))

  points.reduce((passed, point) => {
    point.passed = passed
    return point.passed + (point.duration || 0)
  }, 0)

  points.reduce((distance, point) => {
    point.distance = distance
    return point.distance + (point.meters || 0)
  }, 0)

  return points
}

function getDiff(route, timeA, timeB) {
  const a = interpolatePositionFromRoute(route.started, timeA, points)
  const b = interpolatePositionFromRoute(route.started, timeB, points)

  return {
    distance: b.instruction.distance - a.instruction.distance,
    duration: b.instruction.passed - a.instruction.passed,
  }
}

module.exports = {
  route: interpolatePositionFromRoute,
  getDiff: getDiff,
  points: extractPoints,
}
