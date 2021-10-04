import React, { useState, useEffect } from 'react'
import { StaticMap } from 'react-map-gl'
import DeckGL, { PolygonLayer, ScatterplotLayer, ArcLayer } from 'deck.gl'
import { GeoJsonLayer } from '@deck.gl/layers'
import inside from 'point-in-polygon'

import CommercialAreas from './data/commercial_areas.json'
import KommunStatisticsBox from './components/KommunStatisticsBox'

import Button from './components/Button'

import mapboxgl from 'mapbox-gl'
import HoverInfoBox from './components/HoverInfoBox'
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

const Map = ({ cars, bookings, hubs, kommuner, activeCar, setActiveCar, time }) => {
  const [mapState, setMapState] = useState({
    latitude: 65.0964472642777,
    longitude: 17.112050188704504,
    zoom: 5, // min ~0.6 max 24.0
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
    getPolygon: (k) => k.geometry.coordinates,
    getLineColor: () => [0, 255, 128, 100],
    getFillColor: () => [0, 0, 0, 0], // this isn't actually opaque, it just ends up not rendering any color
    pickable: true,
    onHover: (info, event) => {
      const { object } = info
      setKommunInfo((current) => {
        if (!!object) return object
        // Seems to happen if you leave the viewport at the same time you leave a polygon
        if (!Array.isArray(info.coordinate)) return null

        // If mouse is inside our polygon we keep ourselves open
        if (
          current.geometry.coordinates.some((polygon) =>
            inside(info.coordinate, polygon)
          )
        ) {
          return current
        }
        return null
      })
    },
  })

  const getColorBasedOnFleet = ({ fleet }) => {
    switch (fleet.toLowerCase()) {
      case 'brun':
        return [252, 3, 215]
      case 'bring':
        return [139, 190, 87]
      case 'gul':
        return [251, 255, 84]
      case 'postnord':
        return [57, 123, 184]
      case 'röd':
        return [252, 3, 3]
      default:
        return [254, 254, 254]
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
    getPosition: (c) => {
      return c.position
    },
    getRadius: () => 8,
    getFillColor: getColorBasedOnFleet,
    pickable: true,
    onHover: ({ object, x, y }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'car',
        x,
        y,
      })
    },
    onClick: ({ object }) => {
      setMapState({
        ...mapState,
        zoom: 14,
        longitude: object.position[0],
        latitude: object.position[1],
      })
      setActiveCar(object)
    },
  })

  const bookingLayer = new ScatterplotLayer({
    id: 'booking-layer',
    data: bookings,
    opacity: 1,
    stroked: false,
    filled: true,
    radiusScale: 1,
    radiusUnits: 'pixels',
    getPosition: (c) => {
      return c.destination
    },
    getRadius: () => 4,
    // #fab
    getFillColor: ({ status }) => status === 'Delivered' ? [170, 255, 187] : status === 'Picked up' ? [170, 187, 255, 55] : [255, 170, 187, 55],
    pickable: true,
    onHover: ({ object, x, y }) => {
      // console.log('booking', object)
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'booking',
        title: object.address,
        subTitle: object.isCommercial
          ? '(företag)'
          : ' Status: ' + object.status,
        x,
        y,
      })
    },
  })

  const hubLayer = new ScatterplotLayer({
    id: 'hub-layer',
    data: hubs,
    opacity: 0.4,
    stroked: false,
    filled: true,
    radiusScale: 1,
    radiusUnits: 'pixels',
    getPosition: (c) => {
      return c.position
    },
    getRadius: () => 2,
    // #127DBD
    getFillColor: [0, 255, 128, 120],
    pickable: true,
    onHover: ({ object, x, y }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        type: 'hub',
        title: object.operator,
        x,
        y,
      })
    },
  })


  const [showQueuedBookings, setShowQueuedBookings] = useState(false)

  const arcDataWithQueuedBookings = showQueuedBookings && bookings
    //.filter((booking) => booking.status === 'Queued')
    .map((booking) => {
      if (!cars) return null
      const car = cars.find((car) => car.id === booking.carId)
      if (car === undefined) return null


      switch (booking.status) {
        case 'Picked up': return {
          inbound: getColorBasedOnFleet(car),
          outbound: getColorBasedOnFleet(car),
          from: car.position,
          to: booking.destination
        }
        case 'Queued': return {
          inbound: [178, 169, 2, 20],
          outbound: [178, 169, 2, 20],
          from: car.position,
          to: booking.pickup,
        }
        case 'Delivered': return null

        default: return {
          inbound: [237, 178, 169, 20],
          outbound: [237, 178, 169, 100],
          from: booking.pickup,
          to: booking.destination
        }
      }
    })
    .filter(b => b) // remove null values

  const arcData = cars.map((car) => {
    return {
      inbound: [167, 55, 255],
      outbound: [167, 55, 255],
      from: car.position,
      to: car.heading
    }
  })
  const [showArcLayer, setShowArcLayer] = useState(false)

  const arcLayer = new ArcLayer({
    id: 'arc-layer',
    data: showArcLayer && arcData,
    pickable: true,
    getWidth: 1,
    getSourcePosition: d => d.from,
    getTargetPosition: d => d.to,
    getSourceColor: d => d.inbound,
    getTargetColor: d => d.outbound,
  })


  const arcLayerQueuedBookings = new ArcLayer({
    id: 'arc-layer-queued-bookings',
    data: arcDataWithQueuedBookings,
    pickable: true,
    getWidth: 1,
    getSourcePosition: d => d.from,
    getTargetPosition: d => d.to,
    getSourceColor: d => d.inbound,
    getTargetColor: d => d.outbound,
  })


  useEffect(() => {
    if (!cars.length) return
    if (!activeCar) return
    const car = cars.filter(({ id }) => id === activeCar.id)[0]
    setMapState((state) => ({
      ...state,
      zoom: 14,
      longitude: car.position[0],
      latitude: car.position[1],
    }))
  }, [activeCar, cars])


  return (
    <DeckGL
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
      // initialViewState={mapState.viewport}
      viewState={mapState}
      onViewStateChange={({ viewState }) => {
        setMapState(viewState)
        if (activeCar) {
          setActiveCar(null)
        }
      }}
      onClick={(event) => {
        if (!event.layer) setActiveCar(null)
      }}
      controller={true}
      layers={[
        // The order of these layers matter, roughly equal to increasing z-index by 1
        kommunLayer, // TODO: This hides some items behind it, sort of
        commercialAreasLayer,
        hubLayer,
        bookingLayer,
        carLayer,
        showArcLayer && arcLayer,
        showQueuedBookings && arcLayerQueuedBookings
      ]}
    >
      <div style={{
        right: '40px',
        top: '20px',
        position: 'absolute',
        color: 'rgba(255,255,255,0.5)'
      }}>{new Date(time).toLocaleTimeString()}</div>
      <div style={{
        bottom: '150px',
        right: '200px',
        position: 'absolute'
      }}>
        <Button text="Upphämtning / Avlämning" onClick={() => {

          setShowArcLayer(false)
          setShowQueuedBookings(current => !current)
        }} />
      </div>
      <div style={{
        bottom: '80px',
        right: '200px',
        position: 'absolute'
      }}>
        <Button text={'Nästa stopp'} onClick={() => {
          setShowQueuedBookings(false)
          setShowArcLayer(current => !current)
        }} />
      </div>
      <StaticMap
        reuseMaps
        preventStyleDiffing={true}
        mapStyle="mapbox://styles/mapbox/dark-v10"
      />
      {hoverInfo && mapState.zoom > 8 && <HoverInfoBox data={hoverInfo} />}

      {kommunInfo && <KommunStatisticsBox {...kommunInfo} />}
    </DeckGL>
  )
}

export default Map
