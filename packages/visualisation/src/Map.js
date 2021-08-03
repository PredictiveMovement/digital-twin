import React, { useEffect, useRef, useState } from 'react'
import ReactMapGL from 'react-map-gl'

import GlobalStatisticsBox from './components/KommunStatisticsBox'
import Hubs from './components/Hubs'
import Kommuner from './components/Kommuner'
import Cars from './components/Cars'
import Bookings from './components/Bookings'


import iconHub from './icons/paketombud.png'
import iconPackage from './icons/package.png'
import iconTruckNotFull from './icons/truck_not_full.png'

function iconSizeForViewportZoom(zoomLevel) {
  if (zoomLevel > 15) return 'l'
  if (zoomLevel > 13) return 'm'
  if (zoomLevel > 9) return 's'
  return 'xs'
}

const Map = ({ bookings }) => {
  const [mapState, setMapState] = useState({
    viewport: {
      latitude: 66.0459355,
      longitude: 17.866189,
      zoom: 8, // min ~0.6 max 24.0
      pitch: 40,
    },
  })

  const mapGlRef = useRef(null)

  useEffect(() => {
    if (!mapGlRef.current) return
    const map = mapGlRef.current.getMap()

    map.loadImage(iconHub, function (error, image) {
      if (error) throw error

      map.addImage('custom-warehouse', image)
      console.log('warehouse image loaded')
    })

    map.loadImage(iconPackage, function (error, image) {
      if (error) throw error

      map.addImage('custom-package', image)
      console.log('package image loaded')
    })

    map.loadImage(iconTruckNotFull, function (error, image) {
      if (error) throw error

      map.addImage('custom-truck-not-full', image)
      console.log('truck-not-full image loaded')
    })

  }, [mapGlRef])

  const iconSize = iconSizeForViewportZoom(mapState.viewport.zoom)


  /* 
    Perf warning: This component should re-render as seldom as possible
  */
  return (
    <div>
      <ReactMapGL
        width="100%"
        height="100vh"
        mapStyle="mapbox://styles/mapbox/light-v10"
        {...mapState.viewport}
        onViewportChange={(viewport) => setMapState({ viewport })}
        ref={mapGlRef}
      >

        <Hubs iconSize={iconSize} />
        <Kommuner />
        <Cars iconSize={iconSize} />
        <Bookings iconSize={iconSize} />
      </ReactMapGL>

      {/* <GlobalStatisticsBox totalCars={20} totalBookings={20} bookingsFromHub={30} /> */}
    </div>
  )
}

export default Map
