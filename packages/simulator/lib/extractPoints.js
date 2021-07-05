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

module.exports = extractPoints
