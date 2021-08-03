import * as React from 'react';
import { Layer, Source } from 'react-map-gl';
import { useSocket } from '../../hooks/useSocket';
import { SIZE_TO_IMAGE_SIZE } from '../../mapStyles';

// Important for perf: the markers never change, avoid rerender when the map viewport changes
function Hubs({iconSize}) {
  const [postombud, setPostombud] = React.useState({
    type: "FeatureCollection",
    features: [],
  })

  useSocket('postombud', (newPostombud) => {
    setPostombud(current => ({
      ...current,
      features: newPostombud.map(({ id, operator, position }) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [position.lon, position.lat]
        },
        operator,
        id,
      }))
    }))
  })

  return (
    <Source id="hubs" type="geojson" data={postombud}>
      <Layer
        id='hubs'
        type='symbol'
        layout={{
          "icon-image": 'custom-warehouse',
          "icon-size": SIZE_TO_IMAGE_SIZE[iconSize],
        }}
      />
    </Source>
  )
}

export default React.memo(Hubs)