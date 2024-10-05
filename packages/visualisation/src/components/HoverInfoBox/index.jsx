import React from 'react'
import styled from 'styled-components'
import ProgressBar from '../ProgressBar'
import { Paragraph } from '../Typography'
import moment from 'moment'

const Wrapper = styled.div.attrs((props) => ({
  style: {
    left: props.left - 50,
    bottom: props.top,
  },
}))`
  position: absolute;

  background-color: #fff;
  color: #000;
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
    border-top: solid 10px white;
    border-left: solid 10px transparent;
    border-right: solid 10px transparent;
  }
`

const vehicleName = (vehicleType) => {
  switch (vehicleType) {
    case 'car':
      return 'Bil'
    case 'truck':
      return 'Lastbil'
    case 'recycleTruck':
      return 'Återvinningsfordon'
    default:
      return 'Fordon'
  }
}

const CarInfo = ({ data }) => {
  return (
    <Wrapper left={data.x} top={data.viewport.height - data.y + 20}>
      <div>
        <Paragraph>
          <strong>{`${vehicleName(data.vehicleType)} ${data.id}`}</strong>
        </Paragraph>
        {data.lineNumber !== undefined && (
          <Paragraph>
            Linje: <strong>{data.lineNumber}</strong>
          </Paragraph>
        )}

        <Paragraph>&nbsp;</Paragraph>
        <Paragraph>
          Flotta: <strong>{data.fleet}</strong>
        </Paragraph>
        <Paragraph>
          Status: <strong>{data.status}</strong>
        </Paragraph>
        <Paragraph>
          Återvinningstyper: <strong>{data?.recyclingTypes.join(', ')}</strong>
        </Paragraph>

        <Paragraph>&nbsp;</Paragraph>
        <Paragraph>
          Hastighet: <strong>{data.speed || 0} km/h</strong>
        </Paragraph>
        <Paragraph>
          Avstånd till destination: <strong>{data.ema} m</strong>
        </Paragraph>
        <Paragraph>&nbsp;</Paragraph>
        <Paragraph>
          Körsträcka:{' '}
          <strong>{Math.ceil(10 * data.distance) / 10 || 0} km</strong>
        </Paragraph>
        <Paragraph>
          CO<sub>2</sub>:{' '}
          <strong>{Math.ceil(10 * data.co2) / 10 || 0} kg</strong>
        </Paragraph>

        <Paragraph>&nbsp;</Paragraph>
        <Paragraph>
          Köat: <strong>{data.queue || 0} kärl</strong>
        </Paragraph>
        <Paragraph>
          Upphämtat: <strong>{data.cargo || 0} kärl</strong>
        </Paragraph>
        <Paragraph>
          Tömt: <strong>{data.delivered || 0} kärl</strong>
        </Paragraph>
      </div>

      <Paragraph>&nbsp;</Paragraph>
      {data.passengerCapacity && (
        <div>
          <Paragraph>Passagerarfyllnadsgrad:</Paragraph>
          <ProgressBar
            completed={Math.round(
              Math.min(100, (data.passengers / data.passengerCapacity) * 100) ||
                0
            )}
          />
        </div>
      )}
      {data.parcelCapacity && (
        <div>
          <Paragraph>Fyllnadsgrad 2 kärl:</Paragraph>
          <ProgressBar
            completed={Math.round(
              Math.min(100, (data.cargo / data.parcelCapacity) * 100) || 0
            )}
          />
        </div>
      )}
    </Wrapper>
  )
}

const PassengerInfo = ({ data }) => {
  return (
    <Wrapper left={data.x} top={data.viewport.height - data.y + 20}>
      <Paragraph>
        Namn: <strong>{data.name}</strong>
      </Paragraph>
      {data.home && <Paragraph>Bostad: {data.home.name}</Paragraph>}
      {data.workplace && (
        <Paragraph>Arbetsplats: {data.workplace.name}</Paragraph>
      )}
      <Paragraph>
        CO<sub>2</sub>:{' '}
        <strong>{Math.ceil((10 * data.co2) / 10) || 0} kg</strong>
      </Paragraph>
      <Paragraph>
        Distans: <strong>{Math.ceil(data.distance / 1000) || 0} km</strong>
      </Paragraph>
      <Paragraph>
        Restid:{' '}
        <strong>
          {moment.duration(data.moveTime || 0, 'seconds').humanize()}
        </strong>
      </Paragraph>
      <Paragraph>
        Väntetid:{' '}
        <strong>
          {moment.duration(data.waitTime || 0, 'seconds').humanize()}
        </strong>
      </Paragraph>
    </Wrapper>
  )
}

const GenericInfo = ({ data }) => {
  return (
    <Wrapper left={data.x} top={data.viewport.height - data.y + 20}>
      <Paragraph>
        <strong>{data.id}</strong>
      </Paragraph>
      <Paragraph>{data.title}</Paragraph>
      <Paragraph>{data.subTitle}</Paragraph>
      <Paragraph>
        Typ: {data.type === 'recycle' ? 'återvinningskärl' : data.type}
      </Paragraph>
      <Paragraph>Återvinningstyp: {data.recyclingType}</Paragraph>
      <Paragraph>Bil: {data.carId}</Paragraph>
      {data.deliveryTime ? (
        <Paragraph>
          Leveranstid: {Math.ceil((10 * data.deliveryTime) / 60 / 60) / 10} h
        </Paragraph>
      ) : null}
      {data.pickupDateTime ? (
        <Paragraph>
          Hämtades kl: {moment(data.pickupDateTime).format('HH:mm')}
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
    default:
      return <GenericInfo data={data} />
  }
}

export default HoverInfoBox
