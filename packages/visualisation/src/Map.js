import React, { useState, useEffect, useCallback } from 'react'
import { StaticMap } from 'react-map-gl'
import DeckGL, {
  PolygonLayer,
  ScatterplotLayer,
  ArcLayer,
  LinearInterpolator,
} from 'deck.gl'
import { GeoJsonLayer } from '@deck.gl/layers'
import inside from 'point-in-polygon'
import { ParagraphLarge } from './components/Typography'

import CommercialAreas from './data/commercial_areas.json'
import KommunStatisticsBox from './components/KommunStatisticsBox'
import TimeProgressBar from './components/TimeProgressBar'
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
  extruded: false,
  wireframe: false,
  lineJointRounded: true,
  getLineColor: [0, 128, 255],
})

const transitionInterpolator = new LinearInterpolator(['bearing'])

const Map = ({
  activeLayers,
  taxis,
  passengers,
  cars,
  bookings,
  hubs,
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
    zoom: 5, // min ~0.6 max 24.0
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
    onHover: ({ object, x, y }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        type: 'busStop',
        title: 'Busstopp ' + object.name,
        x,
        y,
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
      name: `bus line ${lineNumber}`,
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
    onHover: ({ object, x, y }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        type: 'busLine',
        title: object.properties.name,
        x,
        y,
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
        return [234, 181, 67, opacity]
      case 'bring':
        return [189, 197, 129, opacity]
      case 'gul':
        return [249, 202, 36, opacity]
      case 'postnord':
        return [57, 123, 184, opacity]
      case 'r??d':
        return [235, 77, 75, opacity]
      case 'l??nstrafiken i norrbotten':
        return [232, 67, 147, opacity]
      case 'dr??narleverans ab':
        return [119, 155, 172, opacity]
      case 'privat':
        return [34, 166, 179, opacity]
      case 'taxi':
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
        return 'Leverans p??g??r'
      case 'queued':
        return 'V??ntar p?? upph??mtning'
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

  const passengerLayer = new ScatterplotLayer({
    id: 'passenger-layer',
    data: passengers,
    //opacity: 0.7,
    stroked: false,
    filled: true,
    radiusScale: 6,
    radiusUnits: 'pixels',
    getPosition: (c) => {
      return c.position
    },
    //getRadius: (c) => (c.fleet === 'Privat' ? 4 : 8),
    getFillColor: ({ inCar }) => (inCar ? [0, 0, 0, 0] : [0, 128, 255, 170]),

    pickable: true,
    onHover: ({ object, x, y }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'passenger',
        x,
        y,
      })
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
    getFillColor: ({ status }) =>
      status === 'Delivered'
        ? [170, 255, 187]
        : status === 'Picked up'
        ? [170, 187, 255, 55]
        : [255, 170, 187, 55],
    pickable: true,
    onHover: ({ object, x, y }) => {
      // console.log('booking', object)
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        ...object,
        type: 'booking',
        title: object.address,
        subTitle: object.isCommercial
          ? '(f??retag)'
          : ' Status: ' + getStatusLabel(object.status),
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
    onHover: ({ object, x, y }) => {
      if (!object) return setHoverInfo(null)
      setHoverInfo({
        type: 'hub',
        title: 'Paketombud f??r ' + object.operator,
        x,
        y,
      })
    },
  })

  const [showQueuedBookings, setShowQueuedBookings] = useState(false)

  const arcDataWithQueuedBookings =
    showQueuedBookings &&
    bookings
      //.filter((booking) => booking.status === 'Queued')
      .map((booking) => {
        if (!cars) return null
        const car = cars.find((car) => car.id === booking.carId)
        if (car === undefined) return null

        switch (booking.status) {
          case 'Picked up':
            return {
              inbound: getColorBasedOnFleet(car),
              outbound: getColorBasedOnFleet(car),
              from: car.position,
              to: booking.destination,
            }
          case 'Queued':
            return {
              inbound: [178, 169, 2, 20],
              outbound: [178, 169, 2, 20],
              from: car.position,
              to: booking.pickup,
            }
          case 'Delivered':
            return null

          default:
            return {
              inbound: [237, 178, 169, 20],
              outbound: [237, 178, 169, 100],
              from: booking.pickup,
              to: booking.destination,
            }
        }
      })
      .filter((b) => b) // remove null values

  const arcData = cars.map((car) => {
    return {
      inbound: [167, 55, 255],
      outbound: [167, 55, 255],
      from: car.position,
      to: car.heading,
    }
  })
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

  const arcLayerQueuedBookings = new ArcLayer({
    id: 'arc-layer-queued-bookings',
    data: arcDataWithQueuedBookings,
    pickable: true,
    getWidth: 1,
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
        activeLayers.commercialAreasLayer && commercialAreasLayer,
        activeLayers.postombudLayer && hubLayer,
        bookingLayer,
        showArcLayer && arcLayer,
        showQueuedBookings && arcLayerQueuedBookings,
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
          text={'Visa n??sta stopp'}
          onClick={() => {
            setShowQueuedBookings(false)
            setShowArcLayer((current) => !current)
          }}
        />
      </div>
      <StaticMap
        reuseMaps
        preventStyleDiffing={true}
        mapStyle="mapbox://styles/mapbox/dark-v10"
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
        <ParagraphLarge>
          Just nu ??r klockan{' '}
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
