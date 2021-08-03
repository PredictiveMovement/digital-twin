import React from 'react'
import { Layer, Source } from 'react-map-gl'
import { useSocket } from '../../hooks/useSocket'
import { SIZE_TO_CIRCLE_RADII, SIZE_TO_IMAGE_SIZE } from '../../mapStyles'


export default function Cars({iconSize}) {
  const [cars, setCars] = React.useState({
    type: 'FeatureCollection',
    features: [],
  })

  useSocket('cars', (newCars) => {
    const features = [
      ...cars.features.filter((car) => !newCars.some((nc) => nc.id === car.id)),
      ...newCars.map(({ id, heading, position }) => ({
        type: 'Feature',
        id,
        heading,
        geometry: { type: 'Point', coordinates: position },
      })),
    ]
    setCars(Object.assign({}, cars, { features }))
  })


  return (

    // <Source id="cars" type="geojson" data={cars}>
    //   <Layer
    //     id='cars'
    //     type='symbol'
    //     layout={{
    //       "icon-image": 'custom-truck-not-full',
    //       "icon-size": SIZE_TO_IMAGE_SIZE[iconSize],
    //     }}
    //   />
    // </Source>
    <Source id="cars" type="geojson" data={cars}>
      <Layer
        id="cars"
        type="circle"
        paint={{
          // 'circle-radius': SIZE_TO_CIRCLE_RADII[iconSize],
          'circle-radius': 10,
          'circle-color': '#10C57B',
        }}
      />
    </Source>
  )
}

