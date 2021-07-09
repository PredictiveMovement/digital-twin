import React, { useState } from 'react'
// import { useDebounce } from '@react-hook/debounce'
import ReactMapGL, { Popup } from 'react-map-gl'
import Pins from './components/Pin'
import ButtonWrapper from './components/ButtonWrapper'
import InfoBox from './components/InfoBox'


const Map = ({ data }) => {
  const [mapState, setMapState] = useState({
    viewport: {
      latitude: 61.8295161,
      longitude: 16.0740589,
      zoom: 8,
      pitch: 0,
    },
  })

  // const [bounds, setBounds] = useDebounce(new WebMercatorViewport(mapState.viewport).getBounds(), 500)
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
        <Pins data={data.hubs} onClick={setPopUpInfo} type={'hub'} />
        <Pins data={data.bookings} onClick={setPopUpInfo} type={'booking'} />
        <Pins data={data.car} onClick={setPopUpInfo} type={'car'} />

        {popUpInfo && (
          <Popup
            tipSize={5}
            anchor="top"
            longitude={popUpInfo.position.longitude}
            latitude={popUpInfo.position.latitude}
            closeOnClick={false}
            onClose={setPopUpInfo}
          >
            <InfoBox popUpInfo={popUpInfo} onClick={setPopUpInfo} />
          </Popup>
        )}
      </ReactMapGL>
      <ButtonWrapper turnOnPM={() => console.log('Turn on PM')} turnOffPM={() => console.log('Turn off PM')} />
    </div >
  )
}

export default Map
