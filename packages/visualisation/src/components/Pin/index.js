import * as React from 'react';
import { Marker } from 'react-map-gl';

import truck from '../../icons/truck.svg'
import booking from '../../icons/booking.svg'
import hub from '../../icons/hub.png'


const SIZE = 20;


// Important for perf: the markers never change, avoid rerender when the map viewport changes
function Pins(props) {
    const { data, onClick, type } = props;
    return data.map(({ geometry: { coordinates }, destination }, index) => {
        return (
            <Marker key={`marker-${index}`} longitude={coordinates.longitude} latitude={coordinates.latitude} >
                <img style={{
                    cursor: 'pointer',
                    stroke: 'none',
                    transform: `translate(${-SIZE / 2}px,${-SIZE}px)`,
                }}
                    src={type === 'hub' ? hub : type === 'booking' ? booking : truck}
                    width={28}
                    height={28}
                    alt={type}
                    onClick={() => {
                        type === 'hub' ?
                            onClick({ type, position: { 'longitude': coordinates.longitude, 'latitude': coordinates.latitude } })
                            : type === 'booking' ?
                                onClick({ type, position: { 'longitude': coordinates.longitude, 'latitude': coordinates.latitude }, destination: { 'longitude': destination.coordinates.longitude, 'latitude': destination.coordinates.latitude } })
                                : onClick({ type, position: { 'longitude': coordinates.longitude, 'latitude': coordinates.latitude } })


                    }} />
            </Marker >
        )
    }
    );
}

export default React.memo(Pins);