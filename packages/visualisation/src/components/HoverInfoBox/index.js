import React from 'react'
import styled from 'styled-components'
import ProgressBar from '../ProgressBar'
import { Paragraph } from '../Typography'

const Wrapper = styled.div`
  position: absolute;
  left: ${(props) => props.left - 50}px;
  bottom: ${(props) => props.top}px;
  background-color: #10c57b;
  min-width: 200px;
  min-height: 60px;
  padding: 1.1rem;
  border-radius: 4px;
  justify-content: space-between;
  z-index: 1;

  :after {
    z-index: -1;
    position: absolute;
    top: 98.1%;
    left: 43%;
    margin-left: -25%;
    content: '';
    width: 0;
    height: 0;
    border-top: solid 10px #10c57b;
    border-left: solid 10px transparent;
    border-right: solid 10px transparent;
  }
`
const MeasurementStationInfo = ({ data }) => {
  return (
    <Wrapper left={data.x} top={data.viewport.height - data.y + 20}>
      <div>
        <Paragraph>Mätpunkt: {data.id}</Paragraph>
        <Paragraph>Antal tunga fordorn: {data.heavyTraficCount}</Paragraph>
        <Paragraph>Mäter bilar som kör: {data.direction}</Paragraph>
        <Paragraph>Antal passerade fordon: {data.count}</Paragraph>
      </div>
    </Wrapper>
  )
}

const vehicleName = (vehicleType) => {
  switch (vehicleType) {
    case 'bus':
      return 'Buss'
    case 'taxi':
      return 'Taxi'
    case 'car':
      return 'Bil'
    case 'truck':
      return 'Lastbil'
    default:
      return 'Fordon'
  }
}

const cargoName = (vehicleType) => {
  switch (vehicleType) {
    case 'bus':
      return 'passagerare'
    case 'taxi':
      return 'passagerare'
    case 'car':
      return 'paket'
    case 'truck':
      return 'kollin'
    default:
      return 'paket'
  }
}

const CarInfo = ({ data }) => {
  return (
    <Wrapper left={data.x} top={data.viewport.height - data.y + 20}>
      <div>
        <Paragraph>{`${vehicleName(data.vehicleType)} ${data.id}`}</Paragraph>
        {data.lineNumber !== undefined && (
          <Paragraph>Linje: {data.lineNumber}</Paragraph>
        )}
        <Paragraph>Hastighet {data.speed}</Paragraph>
        <Paragraph>Kör för {data.fleet}</Paragraph>
        <Paragraph>
          Köat: {data.queue || 0} {cargoName(data.vehicleType)}
        </Paragraph>
        <Paragraph>
          CO<sub>2</sub>: {Math.ceil(10 * data.co2) / 10 || 0} kg
        </Paragraph>
        <Paragraph>
          Körsträcka: {Math.ceil(10 * data.distance) / 10 || 0} km
        </Paragraph>
        <Paragraph>
          Lastat: {data.cargo + data.passengers} {cargoName(data.vehicleType)}
        </Paragraph>
        <Paragraph>
          Kapacitet: {data.capacity} {cargoName(data.vehicleType)}
        </Paragraph>
      </div>
      <div>
        <Paragraph>Fyllnadsgrad:</Paragraph>
        <ProgressBar
          completed={Math.round(
            ((data.cargo + data.passengers) / data.capacity) * 100
          )}
        />
      </div>
    </Wrapper>
  )
}

const PassengerInfo = ({ data }) => {
  return (
    <Wrapper left={data.x} top={data.viewport.height - data.y + 20}>
      <Paragraph>Passagerare {data.id}</Paragraph>
      <Paragraph>Namn: {data.name}</Paragraph>
      <Paragraph>Resor:</Paragraph>
      {data.bookings &&
        data.bookings.map((j) => {
          console.log('RESOR!', j)
          return (
            <Paragraph>
              {j.pickup.name} &gt; {j.destination.name} - {j.status}
            </Paragraph>
          )
        })}
      <Paragraph>
        CO<sub>2</sub>: {Math.ceil((10 * data.co2) / 10) || 0} kg
      </Paragraph>
      <Paragraph>Distans: {Math.ceil(data.distance / 1000) || 0} km</Paragraph>
      <Paragraph>Restid: {Math.ceil(data.moveTime / 60) || 0} min</Paragraph>
      <Paragraph>Väntetid: {Math.ceil(data.waitTime / 60) || 0} min</Paragraph>
    </Wrapper>
  )
}

const GenericInfo = ({ data }) => {
  return (
    <Wrapper left={data.x} top={data.viewport.height - data.y + 20}>
      <Paragraph>{data.title}</Paragraph>
      <Paragraph>{data.subTitle}</Paragraph>
      {data.deliveryTime ? (
        <Paragraph>
          Leveranstid: {Math.ceil((10 * data.deliveryTime) / 60 / 60) / 10} h
        </Paragraph>
      ) : null}
      {data.co2 ? (
        <Paragraph>
          CO<sub>2</sub>: {Math.ceil(10 * data.co2) / 10} kg
        </Paragraph>
      ) : null}
      {data.cost ? (
        <Paragraph>
          Schablonkostnad: {Math.ceil(10 * data.cost) / 10} kr
        </Paragraph>
      ) : null}
    </Wrapper>
  )
}

const HoverInfoBox = ({ data }) => {
  switch (data.type) {
    case 'car':
      return <CarInfo data={data} />
    case 'passenger':
      return <PassengerInfo data={data} />
    case 'measureStation':
      return <MeasurementStationInfo data={data} />
    default:
      return <GenericInfo data={data} />
  }
}

export default HoverInfoBox
