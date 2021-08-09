import React, { useState } from 'react'
import {StaticMap} from 'react-map-gl'
import DeckGL, { PolygonLayer, ScatterplotLayer } from 'deck.gl'

import GlobalStatisticsBox from './components/KommunStatisticsBox'

// import iconHub from './icons/paketombud.png'
// import iconPackage from './icons/package.png'
// import iconTruckNotFull from './icons/truck_not_full.png'

function iconSizeForViewportZoom(zoomLevel) {
  if (zoomLevel > 15) return 'l'
  if (zoomLevel > 13) return 'm'
  if (zoomLevel > 9) return 's'
  return 'xs'
}

const Map = ({ cars, bookings, hubs, kommuner }) => {
  const [mapState, setMapState] = useState({
    latitude: 66.0459355,
    longitude: 17.866189,
    zoom: 8, // min ~0.6 max 24.0
    pitch: 40,
  })

  const [hoverInfo, setHoverInfo] = useState(null)

  const kommunLayer = new PolygonLayer({
    id: 'kommun-layer',
    data: kommuner,
    stroked: true,
    filled: true,
    extruded: true,
    wireframe: true,
    lineWidthUtils: 'pixels',
    lineWidthMinPixels: 20,
    getElevation: 0,
    opacity: 0.02,
    getPolygon: k => k.geometry.coordinates,
    getFillColor: () => [0,128,255],
    getLineColor: () => [0, 0, 0],
    getLineWidth: 20,
  })

  const carLayer = new ScatterplotLayer({
    id: 'car-layer',
    data: cars,
    opacity: 0.4,
    stroked: false,
    filled: true,
    radiusScale: 1,
    radiusUnits: 'pixels',
    getPosition: c => {
      return c.position
    },
    getRadius: () => 8,
    getFillColor: [19, 197, 123],
    pickable: true,
    onHover: ({object, x, y}) => {
      if (!object) setHoverInfo(null)
      // TODO: What do we show when hovering a car?
    }
  }) 

  const bookingLayer = new ScatterplotLayer({
    id: 'booking-layer',
    data: bookings,
    opacity: 0.4,
    stroked: false,
    filled: true,
    radiusScale: 1,
    radiusUnits: 'pixels',
    getPosition: c => {
      return c.position
    },
    getRadius: () => 8,
    // #fab
    getFillColor: [255, 170, 187],
    pickable: true,
    onHover: ({object, x, y}) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        type: 'booking',
        title: object.address,
        x,
        y
      })
    }
  })

  const hubLayer = new ScatterplotLayer({
    id: 'hub-layer',
    data: hubs,
    opacity: 0.4,
    stroked: false,
    filled: true,
    radiusScale: 1,
    radiusUnits: 'pixels',
    getPosition: c => {
      return c.position
    },
    getRadius: () => 8,
    // #127DBD
    getFillColor: [18, 125, 189],
    pickable: true,
    onHover: ({object, x, y}) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        type: 'hub',
        title: object.operator,
        x,
        y
      })
    }
  })

  return (
    <DeckGL 
      // initialViewState={mapState.viewport}
      viewState={mapState}
      onViewStateChange={({viewState}) => {
        setMapState(viewState)
      }}
      controller={true}
      layers={[
        // The order of these layers matter, roughly equal to increasing z-index by 1
        // kommunLayer, // TODO: This hides some items behind it, sort of
        hubLayer,
        bookingLayer, 
        carLayer, 
      ]}
    >
      <StaticMap 
        reuseMaps 
        preventStyleDiffing={true} 
        mapStyle="mapbox://styles/mapbox/light-v10"
      />
      {hoverInfo && mapState.zoom > 8 && (
        <div className="tooltip" style={{left: hoverInfo.x, top: hoverInfo.y}}> 
          {hoverInfo.title}
       </div>
      )}
    </DeckGL>
  )
}

export default Map
