import React, { useState, useEffect, useCallback } from 'react'
import { StaticMap } from 'react-map-gl'
import DeckGL, {
  PolygonLayer,
  ScatterplotLayer,
  ArcLayer,
  LinearInterpolator,
  IconLayer,
} from 'deck.gl'
import { GeoJsonLayer } from '@deck.gl/layers'
import inside from 'point-in-polygon'
import { ParagraphLarge } from './components/Typography'

import KommunStatisticsBox from './components/KommunStatisticsBox'
import TimeProgressBar from './components/TimeProgressBar'
import Button from './components/Button'

import mapboxgl from 'mapbox-gl'
import HoverInfoBox from './components/HoverInfoBox'

// @ts-ignore
mapboxgl.workerClass =
  // eslint-disable-next-line import/no-webpack-loader-syntax
  require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default

const transitionInterpolator = new LinearInterpolator(['bearing'])

const Map = ({
  activeLayers,
  passengers,
  cars,
  bookings,
  postombud,
  measureStations,
  busStops,
  lineShapes,
  kommuner,
  activeCar,
  setActiveCar,
  time,
}) => {
  const [mapState, setMapState] = useState({
    latitude: 65.0964472642777,
    longitude: 17.112050188704504,
    bearing: 0,
    zoom: 5, // NOTE: min ~0.6 max 24.0
    pitch: 40,
  })

  const rotateCamera = useCallback(() => {
    setMapState((mapState) => ({
      ...mapState,
      bearing: mapState.bearing + 1,
      transitionDuration: 1000,
      transitionInterpolator,
      onTransitionEnd: rotateCamera,
    }))
  }, [])

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
    getLineColor: [0, 255, 128, 100],
    getFillColor: [0, 0, 0, 0], // this isn't actually opaque, it just ends up not rendering any color
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

  const busStopLayer = new ScatterplotLayer({
    id: 'busStop-layer',
    data: busStops,
    stroked: false,
    filled: true,
    radiusScale: 3,
    radiusMinPixels: 2,
    radiusMaxPixels: 6,
    getPosition: (c) => {
      return c.position
    },
    getRadius: () => 4,
    getFillColor: [255, 255, 255, 80],
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        type: 'busStop',
        title: 'Busshållplats ' + object.name,
        x,
        y,
        viewport,
      })
    },
  })

  const geoJsonFromBusLine = (coordinates, lineNumber) => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates,
    },
    properties: {
      name: `Buss, linje #${lineNumber}`,
    },
  })
  const geoJsonFromBusLines = (lineShapes) => {
    return lineShapes.map(({ stops, lineNumber }) =>
      geoJsonFromBusLine(stops, lineNumber)
    )
  }
  const busLineLayer = new GeoJsonLayer({
    id: 'busLineLayer',
    data: geoJsonFromBusLines(lineShapes),
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        type: 'busLine',
        title: object.properties.name,
        x,
        y,
        viewport,
      })
    },
    pickable: true,
    lineWidthScale: 3,
    lineWidthMinPixels: 2,
    lineWidthMaxPixels: 6,
    getLineColor: (e) => {
      if (hoverInfo && hoverInfo.title === e.properties.name) {
        return [240, 10, 30]
      }
      return [240, 10, 30, 90]
    },
    getLineWidth: 4,
    pointType: 'circle',
    lineJointRounded: true,
    lineCapRounded: true,
  })

  const getColorBasedOnFleet = ({ fleet }) => {
    const opacity = Math.round((4 / 5) * 255)
    switch (fleet.toLowerCase()) {
      case 'brun':
        return [205, 127, 50, opacity]
      case 'lila':
        return [99, 20, 145, opacity]
      case 'bring':
        return [189, 197, 129, opacity]
      case 'gul':
        return [249, 202, 36, opacity]
      case 'postnord':
        return [57, 123, 184, opacity]
      case 'röd':
        return [235, 77, 75, opacity]
      case 'länstrafiken i norrbotten':
        return [232, 67, 147, opacity]
      case 'drönarleverans ab':
        return [119, 155, 172, opacity]
      case 'privat':
        return [34, 166, 179, opacity]
      case 'taxi':
      case 'anropsstyrd kollektivtrafik':
        return [255, 255, 0, opacity]
      default:
        return [254, 254, 254, opacity]
    }
  }

  const getStatusLabel = (status) => {
    switch (status.toLowerCase()) {
      case 'assigned':
        return 'Tilldelad'
      case 'delivered':
        return 'Levererad'
      case 'picked up':
        return 'Leverans pågår'
      case 'queued':
        return 'Väntar på upphämtning'
      default:
        return status
    }
  }
  /*
  const droneLayer = new ScenegraphLayer({
    id: 'drone-layer',
    data: cars,
    sizeMinPixels: 1,
    sizeMaxPixels: 15,
    scenegraph: '/airplane.glb',
    opacity: 0.9,
    getOrientation: c => [c.bearing, -c.bearing, 90],
    getPosition: (c) => {
      return c.position
    },
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'car',
        x,
        y,
        viewport,
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
  })*/

  const carLayer = new ScatterplotLayer({
    id: 'car-layer',
    data: cars.filter((v) => v.vehicleType === 'car'),
    //opacity: 0.7,
    stroked: false,
    filled: true,
    radiusScale: 6,
    radiusUnits: 'pixels',
    getPosition: (c) => {
      return c.position
    },
    //getRadius: (c) => (c.fleet === 'Privat' ? 4 : 8),
    getFillColor: getColorBasedOnFleet,
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'car',
        x,
        y,
        viewport,
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

  const taxiLayer = new ScatterplotLayer({
    id: 'taxi-layer',
    data: cars.filter((v) => v.vehicleType === 'taxi'),
    //opacity: 0.7,
    stroked: false,
    filled: true,
    radiusScale: 6,
    radiusUnits: 'pixels',
    getPosition: (c) => {
      return c.position
    },
    //getRadius: (c) => (c.fleet === 'Privat' ? 4 : 8),
    getFillColor: getColorBasedOnFleet,
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'car',
        x,
        y,
        viewport,
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

  const busLayer = new ScatterplotLayer({
    id: 'bus-layer',
    data: cars.filter((v) => v.vehicleType === 'bus'),
    stroked: false,
    filled: true,
    radiusScale: 6,
    radiusUnits: 'pixels',
    getPosition: (c) => {
      return c.position
    },
    getFillColor: getColorBasedOnFleet,
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'car',
        x,
        y,
        viewport,
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

  const passengerLayer = new ScatterplotLayer({
    id: 'passenger-layer',
    data: passengers.filter((p) => !p.inVehicle),
    //opacity: 0.7,
    stroked: false,
    filled: true,
    radiusScale: 6,
    radiusUnits: 'pixels',
    getPosition: ({ position }) => {
      return position
    },
    //getRadius: (c) => (c.fleet === 'Privat' ? 4 : 8),
    getFillColor: ({ inVehicle }) =>
      inVehicle ? [0, 0, 0, 0] : [0, 128, 255, 170],

    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'passenger',
        x,
        y,
        viewport,
      })
    },
  })

  const bookingLayer = new ScatterplotLayer({
    id: 'booking-layer',
    data: bookings, //.filter((b) => !b.assigned), // TODO: revert change
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
    getFillColor: (
      { status } // TODO: Different colors for IKEA & HM
    ) =>
      status === 'Delivered'
        ? [170, 255, 187]
        : status === 'Picked up'
        ? [170, 187, 255, 55]
        : [255, 170, 187, 55],
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'booking',
        title: object.sender,
        subTitle: object.isCommercial
          ? '(företag)'
          : ' Status: ' + getStatusLabel(object.status),
        x,
        y,
        viewport,
      })
    },
  })

  const postombudLayer = new ScatterplotLayer({
    id: 'postombud-layer',
    data: postombud,
    opacity: 0.4,
    stroked: false,
    filled: true,
    radiusScale: 5,
    radiusUnits: 'pixels',
    radiusMinPixels: 2,
    radiusMaxPixels: 5,
    getPosition: (c) => {
      return c.position
    },
    // #127DBD
    getFillColor: [0, 255, 128, 120],
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        type: 'postombud',
        title: 'Paketombud för ' + object.operator,
        x,
        y,
        viewport,
      })
    },
  })

  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, anchorY: 150, mask: true },
  }
  const measureStationsLayer = new IconLayer({
    id: 'measureStations-layer',
    data: measureStations,
    iconAtlas:
      'https://raw.githubusercontent.com/visgl/deck.gl/8.8-release/examples/website/icon/data/location-icon-atlas.png',
    iconMapping: ICON_MAPPING,
    getIcon: (d) => 'marker',
    getPosition: (c) => c.position,
    sizeScale: 5,
    getColor: (d) => [
      16,
      (d.count / 10) * 255,
      255 * (d.heavyTrafficCount / 255),
      200,
    ],
    getSize: (d) => 5,
    sizeMaxPixels: 15,
    pickable: true,
    onHover: ({ object, x, y, viewport }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'measureStation',
        x,
        y,
        viewport,
      })
    },
  })

  const [showQueuedBookings, setShowQueuedBookings] = useState(false)

  const routesData =
    showQueuedBookings &&
    bookings
      .filter((b) => b.type !== 'busstop')
      .map((booking) => {
        if (!cars) return null
        const car = cars.find((car) => car.id === booking.carId)
        if (car === undefined) return null

        switch (booking.status) {
          case 'Picked up':
            return {
              inbound: [169, 178, 237, 255],
              outbound: getColorBasedOnFleet(car),
              from: car.position,
              to: booking.destination,
            }
          case 'Assigned':
            return {
              inbound: getColorBasedOnFleet(car),
              outbound: getColorBasedOnFleet(car),
              from: booking.pickup,
              to: booking.destination,
            }
          case 'Queued':
            return {
              inbound: getColorBasedOnFleet(car),
              outbound: [90, 40, 200, 100],
              from: booking.pickup,
              to: booking.destination,
            }
          case 'Delivered':
            return null

          default:
            return {
              inbound: [255, 255, 255, 200],
              outbound: [255, 255, 255, 100],
              from: booking.pickup,
              to: booking.destination,
            }
        }
      })
      .filter((b) => b) // remove null values

  const arcData = cars
    .map((car) => {
      return {
        inbound: [167, 55, 255],
        outbound: [167, 55, 255],
        from: car.position,
        to: car.heading,
      }
    })
    .filter(({ from, to }) => from && to)
  const [showArcLayer, setShowArcLayer] = useState(false)

  const arcLayer = new ArcLayer({
    id: 'arc-layer',
    data: showArcLayer && arcData,
    pickable: true,
    getWidth: 1,
    getSourcePosition: (d) => d.from,
    getTargetPosition: (d) => d.to,
    getSourceColor: (d) => d.inbound,
    getTargetColor: (d) => d.outbound,
  })

  const routesLayer = new ArcLayer({
    id: 'routesLayer',
    data: routesData,
    pickable: true,
    getWidth: 0.5,
    getSourcePosition: (d) => d.from,
    getTargetPosition: (d) => d.to,
    getSourceColor: (d) => d.inbound,
    getTargetColor: (d) => d.outbound,
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
      //mapLib={maplibregl}
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
      // initialViewState={mapState.viewport}
      viewState={mapState}
      // onLoad={rotateCamera}
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
        activeLayers.kommunLayer && kommunLayer, // TODO: This hides some items behind it, sort of
        activeLayers.postombudLayer && postombudLayer,
        activeLayers.measureStationsLayer && measureStationsLayer,
        bookingLayer,
        showArcLayer && arcLayer,
        showQueuedBookings && routesLayer,
        activeLayers.busLineLayer && busLineLayer,
        activeLayers.busStopLayer && busStopLayer,
        activeLayers.carLayer && carLayer,
        activeLayers.taxiLayer && taxiLayer,
        activeLayers.busLayer && busLayer,
        activeLayers.passengerLayer && passengerLayer,
      ]}
    >
      <div
        style={{
          bottom: '150px',
          right: '200px',
          position: 'absolute',
        }}
      >
        <Button
          text="Visa rutter"
          onClick={() => {
            setShowArcLayer(false)
            setShowQueuedBookings((current) => !current)
          }}
        />
      </div>
      <div
        style={{
          bottom: '80px',
          right: '200px',
          position: 'absolute',
        }}
      >
        <Button
          text={'Visa nästa stopp'}
          onClick={() => {
            setShowQueuedBookings(false)
            setShowArcLayer((current) => !current)
          }}
        />
      </div>
      <StaticMap
        reuseMaps
        preventStyleDiffing={true}
        //mapLib={maplibregl}
        //mapStyle="https://maptiler.iteam.services/styles/basic-preview/style.json"
        mapStyle="mapbox://styles/mapbox/dark-v10"
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
      />
      {hoverInfo && mapState.zoom > 6 && <HoverInfoBox data={hoverInfo} />}
      <TimeProgressBar time={time} />
      <div
        style={{
          right: '3rem',
          top: '30px',
          position: 'absolute',
          textAlign: 'right',
        }}
      >
        <ParagraphLarge white>
          Just nu är klockan{' '}
          <b>
            {new Date(time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </b>{' '}
          <br />i simuleringen
        </ParagraphLarge>
      </div>
      {kommunInfo && <KommunStatisticsBox {...kommunInfo} />}
    </DeckGL>
  )
}

export default Map
