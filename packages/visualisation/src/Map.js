import React, { useState } from 'react'
import { useDebounce } from '@react-hook/debounce'
import ReactMapGL, { Layer, Source, WebMercatorViewport } from 'react-map-gl'
import Pins from './components/Pin'
import ButtonWrapper from './components/ButtonWrapper'
import PopUp from './components/PopUp'


const Map = ({ data }) => {
  const [mapState, setMapState] = useState({
    viewport: {
      latitude: 61.8295161,
      longitude: 16.0740589,
      zoom: 8,
      pitch: 0,
    },
  })

  const [bounds, setBounds] = useDebounce(new WebMercatorViewport(mapState.viewport).getBounds(), 500)
  const [popUpInfo, setPopUpInfo] = useState(null);

  // useEffect(() => {
  //   onViewportChange(bounds)
  // }, [bounds, onViewportChange])

  return (
    <div>
      <ReactMapGL
        width="100%"
        height="100vh"
        mapStyle="mapbox://styles/mapbox/streets-v11"
        {...mapState.viewport}
        onViewportChange={(viewport) => {
          setMapState({ viewport })
          // setBounds(new WebMercatorViewport(viewport).getBounds())
        }}
      >
        <Pins data={data.hubs} onClick={setPopUpInfo} color='#007cbf' />

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
        <Pins data={data.bookings} onClick={setPopUpInfo} color='#FF0000' booking={true} />
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
        <Source id="car" type="geojson" data={{
          type: 'FeatureCollection',
          features: data.car
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
      <ButtonWrapper turnOnPM={() => console.log('Turn on PM')} turnOffPM={() => console.log('Turn off PM')} />
      {popUpInfo &&
        <PopUp popUpInfo={popUpInfo} onClick={setPopUpInfo} />
      }
    </div >
  )
}

export default Map
