import React from 'react'
import styled from 'styled-components'
import ProgressBar from '../ProgressBar'
import { Paragraph } from '../Typography'

const Wrapper = styled.div`
  position: absolute;
  left: ${(props) => props.left - 50}px;
  top: ${(props) => props.top - 115}px;
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

const CarInfo = ({ data }) => {
  const label =
    data.vehicleType === 'taxi' || data.vehicleType === 'bus'
      ? 'Passagerare'
      : 'Paket'
  return (
    <Wrapper left={data.x - 8} top={data.y - 80}>
      <div>
        <Paragraph>{`Fordon ${data.id}`}</Paragraph>
        {data.lineNumber !== undefined && (
          <Paragraph>Linje: {data.lineNumber}</Paragraph>
        )}
        <Paragraph>Hastighet {data.speed}</Paragraph>
        <Paragraph>Kör för {data.fleet}</Paragraph>
        <Paragraph>
          Köat: {data.queue || 0} {label}
        </Paragraph>
        <Paragraph>
          CO<sub>2</sub>: {Math.ceil(10 * data.co2) / 10 || 0} kg
        </Paragraph>
        <Paragraph>
          Körsträcka: {Math.ceil(10 * data.distance) / 10 || 0} km
        </Paragraph>
        <Paragraph>
          Lastat: {data.cargo} {label}
        </Paragraph>
        <Paragraph>
          Kapacitet: {data.capacity} {label}
        </Paragraph>
      </div>
      <div>
        <Paragraph>Fyllnadsgrad:</Paragraph>
        <ProgressBar
          completed={Math.round((data.cargo / data.capacity) * 100)}
        />
      </div>
    </Wrapper>
  )
}

const PassengerInfo = ({ data }) => {
  return (
    <Wrapper left={data.x} top={data.y}>
      <Paragraph>Passagerare {data.id}</Paragraph>
      <Paragraph>Namn: {data.name}</Paragraph>
      <Paragraph>Resor:</Paragraph>
      {data.journeys &&
        data.journeys.map((j) => (
          <Paragraph>
            - {j.pickup.name} &gt; {j.destination.name} - {j.status}
          </Paragraph>
        ))}
      <Paragraph>
        CO<sub>2</sub>: {Math.ceil((10 * data.co2) / 10) || 0} kg
      </Paragraph>
      <Paragraph>Distans: {Math.ceil(data.distance / 1000) || 0} km</Paragraph>
      <Paragraph>
        Restid: {Math.ceil(data.moveTime / 60 / 1000) || 0} min
      </Paragraph>
      <Paragraph>
        Väntetid: {Math.ceil(data.waitTime / 60 / 1000) || 0} min
      </Paragraph>
    </Wrapper>
  )
}

const GenericInfo = ({ data }) => {
  return (
    <Wrapper left={data.x} top={data.y - 40}>
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
  return (
    <>
      {data.type === 'car' && <CarInfo data={data} />}
      {data.type === 'passenger' && <PassengerInfo data={data} />}
      {data.type !== 'passenger' && data.type !== 'car' && (
        <GenericInfo data={data} />
      )}
    </>
  )
}

export default HoverInfoBox
