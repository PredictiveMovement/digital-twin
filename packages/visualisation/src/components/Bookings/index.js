import React from 'react'
import { Layer, Source } from 'react-map-gl'
import { useSocket } from '../../hooks/useSocket'
import { SIZE_TO_CIRCLE_RADII } from '../../mapStyles'
// import { SIZE_TO_IMAGE_SIZE } from '../../mapStyles'

export default function Bookings({iconSize}) {
  const [bookings, setBookings] = React.useState({
    type: 'FeatureCollection',
    features: [],
  })

  useSocket('bookings', (newBookings) => {
    const features = [
      ...bookings.features,
      ...newBookings.map(({ position }) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [position.lon, position.lat] },
      })),
    ]
    setBookings(Object.assign({}, bookings, { features }))
  })


  return (
    <Source id="bookings" type="geojson" data={bookings} cluster={false}>
      {/* <Layer
        id='bookings'
        type='symbol'
        layout={{
          "icon-image": 'custom-package',
          "icon-size": SIZE_TO_IMAGE_SIZE[iconSize],
        }}
      /> */}
      <Layer
        id='bookings'
        type="circle"
        paint={{
          // 'circle-radius': 5,
          'circle-radius': SIZE_TO_CIRCLE_RADII[iconSize],
          'circle-color': '#fab',
          'circle-opacity': 0.3
        }}
      />
    </Source>
  )
}