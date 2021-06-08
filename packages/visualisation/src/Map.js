import React, { useState } from 'react'
import ReactMapGL, { Layer, Source } from 'react-map-gl'

const Map = ({ data }) => {
  const [mapState, setMapState] = useState({
    viewport: {
      latitude: 61.8295161,
      longitude: 16.0740589,
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
        <Source id="postombud" type="geojson" data={data.postombud}>
          <Layer
            id="point-post"
            type="circle"
            paint={{
              'circle-radius': 10,
              'circle-color': '#007cbf',
            }}
          />
        </Source>
        <Source id="cars" type="geojson" data={data.cars}>
          <Layer
            id="point"
            type="circle"
            paint={{
              'circle-radius': 10,
              'circle-color': '#ffffff',
            }}
          />
        </Source>

        <Source id="postombud" type="geojson" data={data.pink}>
          <Layer
            id="point-pink"
            type="circle"
            paint={{
              'circle-radius': 10,
              'circle-color': '#FFC0CB',
            }}
          />
        </Source>
      </ReactMapGL>
    </div>
  )
}

export default Map
