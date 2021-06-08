import React, { useState } from 'react'
import ReactMapGL, { Layer, Source } from 'react-map-gl'

const Map = ({ data }) => {
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
      </ReactMapGL>
    </div>
  )
}

export default Map
