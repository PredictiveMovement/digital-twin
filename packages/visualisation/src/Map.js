import React, { useState } from "react";
import ReactMapGL, { Layer, Source } from "react-map-gl";

const Map = ({ data }) => {
  const [mapState, setMapState] = useState({
    viewport: {
      latitude: 61.8294925,
      longitude: 16.0565493,
      zoom: 8,
      pitch: 40,
    },
  });

  return (
    <div>
      <ReactMapGL
        width="100%"
        height="100vh"
        mapStyle="mapbox://styles/mapbox/dark-v10"
        {...mapState.viewport}
        onViewportChange={(viewport) => setMapState({ viewport })}
      >
        <Source id="my-data" type="geojson" data={data}>
          <Layer
            id="point"
            type="circle"
            paint={{
              "circle-radius": 10,
              "circle-color": "#007cbf",
            }}
          />
        </Source>
      </ReactMapGL>
    </div>
  );
};

export default Map;
