import React, { useState } from 'react'
import { StaticMap } from 'react-map-gl'
import DeckGL, { PolygonLayer, ScatterplotLayer } from 'deck.gl'
import { GeoJsonLayer } from '@deck.gl/layers'
import inside from 'point-in-polygon'

import CommercialAreas from './data/commercial_areas.json'
import KommunStatisticsBox from './components/KommunStatisticsBox'
import BookingInfoBox from './components/BookingInfoBox'

import mapboxgl from 'mapbox-gl'
// @ts-ignore
mapboxgl.workerClass =
  // eslint-disable-next-line import/no-webpack-loader-syntax
  require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default

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
    latitude: 65.0964472642777,
    longitude: 17.112050188704504,
    zoom: 8, // min ~0.6 max 24.0
    pitch: 40,
  })

  const [hoverInfo, setHoverInfo] = useState(null)
  const [kommunInfo, setKommunInfo] = useState(null)

  const kommunLayer = new PolygonLayer({
    id: 'kommun-layer',
    data: kommuner,
    stroked: true,
    // we need the fill layer for our hover function
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
    getFillColor: () => [0, 0, 0, 0], // this isn't actually opaque, it just ends up not rendering any color
    pickable: true,
    onHover: (info, event) => {
      const { object } = info
      setKommunInfo(current => {
        if (!!object) return object
        // Seems to happen if you leave the viewport at the same time you leave a polygon
        if (!Array.isArray(info.coordinate)) return null

        // If mouse is inside our polygon we keep ourselves open
        if (current.geometry.coordinates.some(polygon => inside(info.coordinate, polygon))) {
          return current
        }
        return null
      })
    }
  })

  const getCarColorBasedOnFleet = ({ fleet }) => {
    console.log('Fleet', fleet)
    switch (fleet.toLowerCase()) {
      case 'bussgods':
        return [255, 255, 255]
      case 'dhl':
        return [255, 255, 0]
      case 'postnord':
        return [0, 0, 255]
      case 'schenker':
        return [255, 0, 0]
      default:
        return [19, 197, 123]
    }
  }

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
    getFillColor: getCarColorBasedOnFleet,
    pickable: true,
    onHover: ({ object, x, y }) => {
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
    getRadius: () => 3,
    // #fab
    getFillColor: ({ status }) => status === 'New' ? [255, 170, 187] : status === 'Delivered' ? [170, 187, 255] : [170, 255, 187, 0.3],
    pickable: true,
    onHover: ({ object, x, y }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        type: 'booking',
        title: object.address,
        subTitle: object.isCommercial ? '(företag)' : ' Status: ' + object.status,
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
    getRadius: () => 3,
    // #127DBD
    getFillColor: [18, 125, 189],
    pickable: true,
    onHover: ({ object, x, y }) => {
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
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
      // initialViewState={mapState.viewport}
      viewState={mapState}
      onViewStateChange={({ viewState }) => {
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
        mapStyle="mapbox://styles/mapbox/dark-v10"
      />
      {hoverInfo && mapState.zoom > 8 && (
        <BookingInfoBox position={{ left: hoverInfo.x, top: hoverInfo.y }} title={hoverInfo.title} subTitle={hoverInfo.subTitle} />
      )}

      {kommunInfo && (
        <KommunStatisticsBox {...kommunInfo} />
      )}
    </DeckGL>
  )
}

export default Map
