import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import MunicipalityStatisticsBox from './components/MunicipalityStatisticsBox'
import TimeProgressBar from './components/TimeProgressBar'
import LayersMenu from './components/LayersMenu/index.jsx'
import HoverInfoBox from './components/HoverInfoBox'

const transitionInterpolator = new LinearInterpolator(['bearing'])

const Map = ({
  activeLayers,
  passengers,
  cars,
  bookings,
  postombud,
  recycleCollectionPoints,
  busStops,
  lineShapes,
  municipalities,
  activeCar,
  setActiveCar,
  time,
  setShowEditExperimentModal,
  experimentId,
  initMapState,
}) => {
  const [mapState, setMapState] = useState({
    bearing: 0,
    pitch: 40,
    ...initMapState,
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
  const [municipalityInfo, setMunicipalityInfo] = useState(null)
  const municipalityLayer = new PolygonLayer({
    id: 'municipality-layer',
    data: municipalities,
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
      setMunicipalityInfo((current) => {
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
    const opacity = Math.round((4 / 5) * 255)
    switch (fleet.toLowerCase()) {
      case 'brun':
        return [205, 127, 50, opacity]
      case 'tnt':
      case 'lila':
        return [99, 20, 145, opacity]
      case 'bring':
      case 'grön':
        return [189, 197, 129, opacity]
      case 'dhl':
      case 'gul':
        return [249, 202, 36, opacity]
      case 'blå':
      case 'postnord':
        return [57, 123, 184, opacity]
      case 'röd':
      case 'schenker':
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
        return 'Återvinningsfordon tömt'
      case 'picked up':
        return 'Tömd'
      case 'queued':
        return 'Väntar på tömning'
      default:
        return status
    }
  }

  const carLayer = new ScatterplotLayer({
    id: 'car-layer',
    data: cars.filter((v) => v.vehicleType === 'recycleTruck'),
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

  const bookingLayer = new ScatterplotLayer({
    id: 'booking-layer',
    data: bookings.filter((b) => b.type === 'recycle'), //.filter((b) => !b.assigned), // TODO: revert change
    opacity: 1,
    stroked: false,
    filled: true,
    radiusScale: 1,
    radiusUnits: 'pixels',
    getPosition: (c) => {
      return c.pickup
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

  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, anchorY: 150, mask: true },
  }

  const [showAssignedBookings, setShowAssignedBookings] = useState(false)
  const [showActiveDeliveries, setShowActiveDeliveries] = useState(false)

  const routesData =
    (showActiveDeliveries || showAssignedBookings) &&
    bookings
      .map((booking) => {
        if (!cars) return null
        const car = cars.find((car) => car.id === booking.carId)
        if (car === undefined) return null

        switch (booking.status) {
          case 'Picked up':
            return (
              showActiveDeliveries && {
                inbound: [169, 178, 237, 55],
                outbound: getColorBasedOnFleet(car),
                from: car.position,
                to: booking.destination,
              }
            )
          case 'Assigned':
            return (
              showAssignedBookings && {
                inbound: getColorBasedOnFleet(car),
                outbound: getColorBasedOnFleet(car),
                from: car.position,
                to: booking.pickup,
              }
            )
          case 'Queued':
            return (
              showAssignedBookings && {
                inbound: [255, 255, 255, 50],
                outbound: [255, 255, 255, 50],
                from: car.position,
                to: booking.pickup,
              }
            )
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
    if (!car) return
    setMapState((state) => ({
      ...state,
      zoom: 14,
      longitude: car.position[0],
      latitude: car.position[1],
    }))
  }, [activeCar, cars])

  const map = useRef()

  return (
    <DeckGL
      //mapLib={maplibregl}
      mapboxApiAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      // initialViewState={mapState.viewport}
      viewState={mapState}
      ref={map}
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
        activeLayers.municipalityLayer && municipalityLayer, // TODO: This hides some items behind it, sort of
        bookingLayer,
        showArcLayer && arcLayer,
        (showAssignedBookings || showActiveDeliveries) && routesLayer,
        activeLayers.carLayer && carLayer,
      ]}
    >
      <div
        style={{
          bottom: '40px',
          right: '20px',
          position: 'absolute',
        }}
      >
        <LayersMenu
          activeLayers={activeLayers}
          showArcLayer={showArcLayer}
          setShowArcLayer={setShowArcLayer}
          showActiveDeliveries={showActiveDeliveries}
          setShowActiveDeliveries={setShowActiveDeliveries}
          showAssignedBookings={showAssignedBookings}
          setShowAssignedBookings={setShowAssignedBookings}
          setShowEditExperimentModal={setShowEditExperimentModal}
          experimentId={experimentId}
        />
      </div>
      <StaticMap
        reuseMaps
        preventStyleDiffing={true}
        //mapLib={maplibregl}
        //mapStyle="https://maptiler.iteam.services/styles/basic-preview/style.json"
        mapStyle="mapbox://styles/mapbox/dark-v10"
        mapboxApiAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      />
      {hoverInfo && mapState.zoom > 6 && <HoverInfoBox data={hoverInfo} />}

      {/* Time progress bar. */}
      <TimeProgressBar time={time} />

      {/* Experiment clock. */}
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

      {/* Municipality stats. */}
      {municipalityInfo && <MunicipalityStatisticsBox {...municipalityInfo} />}
    </DeckGL>
  )
}

export default Map
