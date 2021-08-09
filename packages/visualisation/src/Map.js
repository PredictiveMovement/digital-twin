import React, { useState } from 'react'
import {StaticMap} from 'react-map-gl'
import DeckGL, { PolygonLayer, ScatterplotLayer } from 'deck.gl'

import CommercialAreas from './data/commercial_areas.json'
import GlobalStatisticsBox from './components/KommunStatisticsBox'
import { GeoJsonLayer } from '@deck.gl/layers'

const commercialAreasLayer = new GeoJsonLayer({
  id: 'commercial-areas',
  data: CommercialAreas,
  stroked: true,
  filled: false,
  extured: false,
  wireframe: false,
  lineJointRounded: true,
  getLineColor: [0, 255, 128],
})


const Map = ({ cars, bookings, hubs, kommuner }) => {
  const [mapState, setMapState] = useState({
    latitude: 66.0459355,
    longitude: 17.866189,
    zoom: 8, // min ~0.6 max 24.0
    pitch: 40,
  })

  const [hoverInfo, setHoverInfo] = useState(null)
  const [kommunInfo, setKommunInfo] = useState(null)

  const kommunLayer = new PolygonLayer({
    id: 'kommun-layer',
    data: kommuner,
    stroked: true,
    filled: true,
    extruded: false,
    wireframe: false,
    lineWidthUtils: 'pixels',
    lineWidthMinPixels: 1,
    getLineWidth: 50,
    lineJointRounded: true,
    getElevation: 0,
    opacity: 0.3,
    polygonOffset: 1,
    getPolygon: k => k.geometry.coordinates,
    getLineColor: () => [0, 128, 255],
    getFillColor: () => [0, 0, 0, 0],
    pickable: true,
    onHover: ({object, x, y}) => {
      // setKommunInfo(current => {
      //   if (!!current && !object) {
      //     return null
      //   } else {
      //     // return current
      //     return object || null
      //   }
      // })
    }
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
        kommunLayer, // TODO: This hides some items behind it, sort of
        commercialAreasLayer,
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
      {kommunInfo && (
        <div className="kommun" style={{left: 0, top: 0, position: 'absolute', height: 140, width: 140, backgroundColor: 'white'}}>
          {JSON.stringify(kommunInfo, null, 2)}
        </div>
      )}
    </DeckGL>
  )
}

export default Map
