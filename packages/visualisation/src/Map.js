import React, { useState, useEffect } from 'react'
import {useDebounce} from '@react-hook/debounce'
import ReactMapGL, { Layer, Source, WebMercatorViewport } from 'react-map-gl'

const Map = ({ data, onViewportChange }) => {
  const [mapState, setMapState] = useState({
    viewport: {
      width: 800,
      height: 600,
      latitude: 61.8295161,
      longitude: 16.0740589,
      zoom: 8,
      pitch: 0,
    },
  })

  const [bounds, setBounds] = useDebounce(new WebMercatorViewport(mapState.viewport).getBounds(), 500)
  
  useEffect(() => {
    onViewportChange(bounds)
    console.log({ bounds })
  }, [bounds])


  return (
    <div>
      <ReactMapGL
        width="100%"
        height="100vh"
        mapStyle="mapbox://styles/mapbox/streets-v11"
        {...mapState.viewport}
        onViewportChange={(viewport) => {
          setMapState({ viewport })
          setBounds(new WebMercatorViewport(viewport).getBounds())
        }}
      >
        <Source id="hubs" type="geojson" data={data.hubs}>
          <Layer
            id="hub-point"
            type="circle"
            paint={{
              'circle-radius': 7,
              'circle-color': '#007cbf',
            }}
          />
        </Source>
      </ReactMapGL>
    </div>
  )
}

export default Map
