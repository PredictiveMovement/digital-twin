import React from 'react'
import { Layer, Source } from 'react-map-gl'
import { useSocket } from '../../hooks/useSocket'

import areas from './areas.json'


function Kommuner() {
  const [kommuner, setKommuner] = React.useState({})

  useSocket('kommun', newKommuner => {
    setKommuner(kommuner => {
      return newKommuner.reduce(
        (acc, kommun) => ({...acc, [kommun.name]: kommun}),
        kommuner 
      )
    })
  })

  return (
    <>
      <Source
        id="business-areas"
        type="geojson"
        // data={{
        //   type: 'FeatureCollection',
        //   features: Object.values(kommuner),
        // }}
        data={areas}
      >
        <Layer
          id='kommun-business-areas'
          type='line'
          paint={{
            'line-color': '#00ff80',
            'line-width': 3,
            'line-opacity': 0.3,
          }}
        />
      </Source>
      <Source
        id="kommuner"
        type="geojson"
        data={{
          type: 'FeatureCollection',
          features: Object.values(kommuner),
        }}
      >
        <Layer
          id='kommun-outlay'
          type='line'
          paint={{
            'line-color': '#0080ff',
            'line-width': 3,
            'line-opacity': 0.3,
          }}
        />
      </Source>
    </>
  )
}

export default React.memo(Kommuner, () => false)