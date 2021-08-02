import React, { useState } from 'react'
import ReactMapGL, { Layer, Source } from 'react-map-gl'

const Map = ({ postombud, cars, bookings, kommuner }) => {
  const [mapState, setMapState] = useState({
    viewport: {
      latitude: 66.0459355,
      longitude: 17.866189,
      zoom: 8,
      pitch: 40,
    },
  })

  return (
    <div>
      <ReactMapGL
        width="100%"
        height="100vh"
        mapStyle="mapbox://styles/mapbox/dark-v10"
        {...mapState.viewport}
        onViewportChange={(viewport) => setMapState({ viewport })}
      >
        <Source id="postombud" type="geojson" data={postombud}>
          <Layer
            id="point-post"
            type="circle"
            paint={{
              'circle-radius': 4,
              'circle-color': '#007cbf',
            }}
          />
        </Source>
        
        <Source id="bookings" type="geojson" data={bookings}>
          <Layer
            id="booking"
            type="circle"
            paint={{
              'circle-radius': 4,
              'circle-color': '#fab',
            }}
          />
        </Source>

        <Source id="cars" type="geojson" data={cars}>
          <Layer
            id="car"
            type="circle"
            paint={{
              'circle-radius': 8,
              'circle-color': '#ffffff',
            }}
          />
        </Source>

     
        <Source
          type="geojson"
          data={kommuner}
        >
          <Layer
            id='data'
            type='line'
            paint={{
              'line-color': '#0080ff',
              'line-width': 3,
              'line-opacity': 0.3,
            }}
          />
        </Source>
      </ReactMapGL>
    </div>
  )
}

export default Map
