import React, { useState, useEffect } from 'react'
import { useDebounce } from '@react-hook/debounce'
import ReactMapGL, { Layer, Source, WebMercatorViewport } from 'react-map-gl'
import Pins from './components/pin'

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
  const [popupInfo, setPopupInfo] = useState(null);

  useEffect(() => {
    onViewportChange(bounds)
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
        {/* <Pins data={data.hubs} onClick={setPopupInfo} color='#007cbf' /> */}
        {/* <Source id="hubs" type="geojson" data={data.hubs}>
          <Layer
            onClick={() => console.log('hej')}
            id="hub-point"
            type="circle"
            paint={{
              'circle-radius': 7,
              'circle-color': '#007cbf',
            }}
          />
        </Source> */}
        <Pins data={data.bookings} onClick={setPopupInfo} color='#FF0000' />
        {/* 
        <Source id="bookings" type="geojson" data={data.bookings}>
        <Layer
        id="booking-point"
        type="circle"
        paint={{
          'circle-radius': 7,
          'circle-color': '#FF0000',
        }}
        />
      </Source> */}
        <Source id="cars" type="geojson" data={{
          type: 'FeatureCollection',
          features: data.cars
        }}>
          <Layer
            id="car-point"
            type="circle"
            paint={{
              'circle-radius': 7,
              'circle-color': '#3ad134',
            }}
          />
        </Source>
      </ReactMapGL>
      {popupInfo &&
        <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'white', padding: '8px' }}>
          <pre>{JSON.stringify(popupInfo, null, 2)}</pre>
        </div>
      }
    </div >
  )
}

export default Map
